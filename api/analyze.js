const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify({
    model: "claude-3-haiku-20240307",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Explain these lab results in plain English. Provide a structured medical-style summary:

${text}`
      }
    ]
  })
});
