module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { text, fileData, fileType, fileName } = req.body || {};

    // For now, only support text in this endpoint
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text. (PDF/Photo not wired yet)" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });

    const prompt =
      `Explain these lab results in plain English.\n` +
      `Rules: No diagnosis. No medication advice. Give questions to ask a doctor.\n\n` +
      `Lab results:\n${text}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 700,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Anthropic error", details: data });
    }

    const result =
      (data?.content || []).map(c => c.text).filter(Boolean).join("\n\n") || "No response.";

    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
};
