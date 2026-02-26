// api/analyze.js  (CommonJS - safest on Vercel)

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const body = req.body || {};
    const text = body.text;

    // Basic validation (your UI sends { text } for "Type Results")
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in Vercel env vars" });
    }

    // Use a REAL model id (avoid "-latest" to stop the 404)
    const model = "claude-3-5-sonnet-20241022";

    const systemPrompt =
      "You are LabPlain. Explain lab results in plain English.\n" +
      "Rules:\n" +
      "- No diagnosis.\n" +
      "- No medication advice.\n" +
      "- Explain what each value generally means and common non-medical next steps.\n" +
      "- Suggest questions to ask a doctor.\n" +
      "- Be calm and clear.\n";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    const data = await r.json();

    // If Anthropic returns an error, show it clearly
    if (!r.ok) {
      return res.status(500).json({
        error: "Anthropic API error",
        status: r.status,
        details: data,
      });
    }

    const resultText =
      (data.content && data.content[0] && data.content[0].text) ||
      "No response text returned.";

    return res.status(200).json({ result: resultText });
  } catch (err) {
    return res.status(500).json({
      error: "Server crashed",
      message: err?.message || String(err),
    });
  }
};
