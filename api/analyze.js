// api/analyze.js
// Vercel Serverless Function (Node.js)
// Expects POST JSON: { "text": "..." }
// Returns: { summary, results, red_flags, questions_for_doctor, disclaimer }

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server not configured: missing ANTHROPIC_API_KEY",
      });
    }

    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return res.status(400).json({ error: "Please provide lab result text." });
    }

    // Basic abuse guard
    if (text.length > 12000) {
      return res
        .status(413)
        .json({ error: "Input too long. Please paste a smaller section." });
    }

    const systemPrompt = `
You are LabPlain, a patient-friendly lab result explainer.

Safety rules (must follow):
- Do NOT diagnose or claim certainty.
- Do NOT provide medical advice or treatment plans.
- Explain results in plain English, using general educational context.
- If a result could be urgent, say: "Consider contacting a clinician promptly" (no alarmist language).
- Never suggest stopping/starting medication.
- If information is missing (age/sex/pregnancy status/units/reference ranges), say what is missing and keep interpretation general.
- Keep output short, clear, and structured.

Output must be valid JSON with this exact schema:
{
  "summary": "2-4 sentences plain English overview",
  "results": [
    {
      "test": "string",
      "value": "string",
      "range": "string (if provided)",
      "status": "normal|borderline|high|low|unknown",
      "plain_english": "1-2 sentences",
      "common_causes": ["string","string"],
      "what_to_do_next": ["string","string"]
    }
  ],
  "red_flags": ["string"],
  "questions_for_doctor": ["string","string","string"],
  "disclaimer": "string"
}

Important:
- If you cannot confidently parse individual tests, still return the schema with an empty results array and explain in summary what you need.
`;

    const userPrompt = `Lab results text (as provided by the patient). Explain in plain English:

${text}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 900,
        temperature: 0.2,
        system: systemPrompt.trim(),
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Anthropic API error",
        details: data,
      });
    }

    // Anthropic returns content as an array; we want the text block
    const contentBlock = Array.isArray(data?.content) ? data.content[0] : null;
    const rawText = contentBlock?.text || "";

    // Try to parse JSON from the model
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // Fallback: return raw text so you can debug the prompt/output
      return res.status(200).json({
        summary: "Could not parse structured output. Showing raw response.",
        results: [],
        red_flags: [],
        questions_for_doctor: [],
        disclaimer:
          "Educational only. Not medical advice. If you’re concerned, contact a clinician.",
        raw: rawText,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err?.message || String(err),
    });
  }
}
