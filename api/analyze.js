export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text" });
  }

  return res.status(200).json({
    output: "✅ Analyze API is working. First 300 chars:\n\n" + text.slice(0, 300),
  });
}
