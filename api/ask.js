// This runs on Vercel's server, never in the browser.
// The API key lives only here, read from an environment variable —
// it is never sent to, or visible from, the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' });
  }

  const { record, question } = req.body || {};
  if (!question || !record) {
    return res.status(400).json({ error: 'Missing record or question.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing its AI key. (GEMINI_API_KEY not set)' });
  }

  const prompt = `You are a careful assistant helping a family member quickly answer a doctor's question using the patient's stored records below. Only use information given — never invent medications, doses, or conditions that aren't listed. If the records don't contain the answer, say so plainly and suggest what to ask the family. Be concise, plain-language, and formatted for someone standing in front of a doctor.

--- RECORDS ---
${record}

--- QUESTION ---
${question}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(502).json({ error: data.error?.message || 'AI service error.' });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim() ||
      'No answer returned.';

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Could not reach the AI service: ' + e.message });
  }
}
