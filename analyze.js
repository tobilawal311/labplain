export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server not configured: missing ANTHROPIC_API_KEY" });
    }

    const { text, fileData, fileType, fileName } = req.body || {};

    // Build messages array based on input type
    let messages = [];

    if (fileData && fileType) {
      // Image upload — send as vision
      if (fileType.startsWith("image/")) {
        messages = [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: fileType,
                data: fileData
              }
            },
            {
              type: "text",
              text: "These are lab results from an image. Please explain each value in plain English."
            }
          ]
        }];
      } else if (fileType === "application/pdf") {
        // PDF — send as document
        messages = [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: fileData
              }
            },
            {
              type: "text",
              text: "These are lab results from a PDF. Please explain each value in plain English."
            }
          ]
        }];
      }
    } else if (text && text.trim().length >= 5) {
      // Plain text input
      if (text.length > 12000) {
        return res.status(413).json({ error: "Input too long. Please paste a smaller section." });
      }
      messages = [{
        role: "user",
        content: text
      }];
    } else {
      return res.status(400).json({ error: "Please provide lab result text or upload a file." });
    }

    const systemPrompt = `You are LabPlain, a patient-friendly lab result explainer.

Safety rules:
- Do NOT diagnose or claim certainty
- Do NOT provide medical advice or treatment plans
- Explain results in plain English using general educational context
- If a result could be urgent, say: "Consider contacting a clinician promptly"
- Never suggest stopping or starting medication

Format your response clearly with these sections:
SUMMARY: 2-4 sentences overview in plain English

YOUR RESULTS:
For each test: name, value, whether it is normal/high/low, and a plain English explanation

THINGS TO NOTE:
Any values that are outside normal range worth discussing with a doctor

QUESTIONS TO ASK YOUR DOCTOR:
3-5 specific questions based on these results

Always end with: "This explanation is for educational purposes only and is not medical advice. Please discuss your results with your healthcare provider."`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Anthropic API error", details: data });
    }

    const resultText = data.content && data.content[0] ? data.content[0].text : "";
    return res.status(200).json({ result: resultText });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message || String(err) });
  }
}
