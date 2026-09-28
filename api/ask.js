export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { record, question } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: 'No question provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured with an API key' });
  }

  const systemInstruction = `You are a helpful medical-records assistant for a family health app. Answer ONLY using the patient record data provided below. If the answer isn't in the records, say so clearly rather than guessing or inventing information. Keep answers concise and easy to read, using short paragraphs or bullet points where helpful. Never invent diagnoses, medications, or values that are not explicitly present in the record.

IMPORTANT — language matching: Always respond in the same language and script the question was asked in.
- If the question is in Hindi (Devanagari script), respond in Hindi (Devanagari script).
- If the question is in Hinglish (Hindi words written in Roman/English letters, e.g. "kon kon si bimari hai"), respond the same way — in Hinglish, using Roman letters, not Devanagari.
- If the question is in English, respond in English.
- If you're unsure, match the dominant language of the question as a bilingual family member naturally would.
Do not translate medical terms, medicine names, or numbers — keep those as-is regardless of language.

Patient record:
${record || 'No record provided.'}`;

  // Gemini 3.5 Flash defaults to "medium" thinking, which adds noticeable latency.
  // Looking up facts from a provided record doesn't need deep reasoning, so we use "low".
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: question }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'low' }
    }
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const maxAttempts = 3;
  let lastMessage = '';
  let lastStatus = 500;
  let quotaExceeded = false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const data = await response.json();

      if (response.ok) {
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer returned.';
        return res.status(200).json({ answer });
      }

      lastMessage = data.error?.message || 'Unknown error';
      lastStatus = response.status;

      // 429 = rate/quota limit. Retrying cannot fix this — the daily allowance is
      // simply used up, and burning more retries only wastes more of it. Fail immediately.
      if (response.status === 429) {
        quotaExceeded = true;
        break;
      }

      // 503 / "overloaded" = Google's server is momentarily busy, unrelated to our
      // own quota. This kind of failure genuinely can resolve within a second or two.
      const isServerOverload = response.status === 503 || /overloaded|high demand|unavailable/i.test(lastMessage);
      if (isServerOverload && attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
      break;
    } catch (err) {
      lastMessage = err.message;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
    }
  }

  // Log the real error so it's visible in Vercel's function logs for debugging.
  console.error('Gemini request failed:', lastStatus, lastMessage);

  const friendly = quotaExceeded
    ? "The assistant has reached today's usage limit for this demo. Please try again after some time, or check back tomorrow."
    : /overloaded|high demand|unavailable/i.test(lastMessage)
      ? "The assistant is a bit busy right now. Please wait a few seconds and try asking again."
      : "Something went wrong reaching the assistant. Please try again in a moment.";

  return res.status(lastStatus || 500).json({ error: friendly });
}
