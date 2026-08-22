Vault — Family Health Records

Live demo → (no login needed — resets automatically on your next visit)

Vault is a concept app for keeping a family's medical history in one place — medications, conditions, doctor visits, and readings for every family member — with an AI assistant that can answer questions instantly from stored records, the way a doctor would want it summarized.

This is a demo/prototype built to explore product decisions around family health data, not production software. The public demo uses a fictional family (the Sharmas) and resets automatically so it's safe for anyone to try.

What it does
Family profiles — add, edit, or remove family members, each with their own emergency card (blood group, DOB, emergency contact), medications, timeline, and personal care team
Medications with real lifecycle handling — discontinuing a medication logs it to the timeline with a date and reason instead of silently deleting it, so nothing gets lost from the medical history
Timeline — conditions, allergies, visits, and readings in one place, filterable by category
Interactive health trend charts — blood sugar and blood pressure (tracked properly as systolic/diastolic, not a single number), with tap-to-see exact values and time-range filters
AI assistant, two ways — ask about one specific person, or ask the "Family Assistant" cross-family questions like "who has any allergies?" Answers are grounded only in stored records
Emergency & Care Resources — a place for the family's regular doctors, plus household-level resources like the nearest hospital with ambulance support
Upcoming visits reminder — a small badge surfaces any doctor follow-up in the next 60 days, pulled directly from visit records (no separate data entry)
PDF export — a real, doctor-readable one-page summary, not a screenshot of the app
Dark mode
A few product decisions worth noting
Two-scope AI assistant. A single blended assistant makes every answer ambiguous about who it's talking about. Splitting it into per-person and family-wide scopes means every question has an obvious, correct scope.
Medications never just disappear. Since the app's purpose is showing a doctor the full picture, discontinuing a medication logs why and when to the timeline rather than deleting the record outright.
Blood pressure is two numbers, not one. Real BP readings are systolic/diastolic together — the app reflects that instead of flattening it into a single fake value.
No native browser popups. Every confirmation (delete, discontinue, reset) uses an in-app styled modal for a consistent experience, not a jarring alert()/confirm().
Tech

Single-file HTML/CSS/JS frontend (no build step), deployed on Vercel. A small serverless function (api/ask.js) calls the Gemini API server-side so the API key is never exposed to the browser.

Running locally

Clone the repo, open public/index.html directly in a browser — everything except the AI assistant works with no setup. The assistant requires a GEMINI_API_KEY environment variable set in a Vercel deployment (or equivalent serverless environment) to power api/ask.js.
