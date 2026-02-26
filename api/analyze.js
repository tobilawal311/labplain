export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel env" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You explain medical lab results in plain English. No diagnosis. No medication advice. No treatment plans. Use short sections: Summary, What stands out, What it can mean (non-diagnostic), Questions to ask your doctor. Keep it clear and calm."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "OpenAI request failed", details: data });
    }

    const output = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ output });

  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
