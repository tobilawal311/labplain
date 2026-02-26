module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
    }

    const prompt = `
You are LabPlain. Explain the lab results in plain English.
Rules:
- No diagnosis
- No medication advice
- Provide: what it means, common causes, what to ask the doctor
Lab results:
${text}
`.trim();

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: "Anthropic error",
        status: r.status,
        details: data,
      });
    }

    const output =
      data?.content?.map((c) => c.text).join("\n").trim() ||
      "No output returned.";

    return res.status(200).json({ output });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
};
