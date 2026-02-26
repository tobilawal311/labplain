// api/analyze.js (CommonJS — guaranteed to work on Vercel)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const text = body?.text;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    return res.status(200).json({
      result:
        "✅ Analyze API is working.\n\nFirst 300 characters:\n\n" +
        text.slice(0, 300),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
};
