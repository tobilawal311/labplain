export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { labText } = req.body;

  if (!labText) {
    return res.status(400).json({ error: 'No lab text provided' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are LabPlain, a patient-friendly lab result interpreter.

Your job:
1. Explain each value in plain English
2. Note if any value is outside normal range using simple language
3. End with 3-5 questions the patient could ask their doctor

Rules:
- Do NOT diagnose any condition
- Do NOT recommend medication or treatment
- Keep language warm, clear, and reassuring
- No medical jargon without explanation

Lab results:
${labText}`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: 'API error', details: data });
  }

  return res.status(200).json({ result: data.content[0].text });
}
