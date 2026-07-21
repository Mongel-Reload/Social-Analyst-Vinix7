const { getEnv, json } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { comments } = JSON.parse(event.body);
    
    if (!comments || !Array.isArray(comments)) {
      throw new Error("Invalid comments data");
    }

    const provider = process.env.AI_PROVIDER || "anthropic";
    let apiKey;
    let model;
    let apiUrl;
    let headers;
    let body;

    if (provider === "anthropic") {
      apiKey = process.env.ANTHROPIC_API_KEY;
      model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
      apiUrl = "https://api.anthropic.com/v1/messages";
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      };
      body = {
        model: model,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Analisis sentimen dari komentar-komentar berikut. Berikan output dalam format JSON dengan struktur:
{
  "summary": {
    "total": number,
    "positive": number,
    "negative": number,
    "neutral": number
  },
  "comments": [
    {
      "username": string,
      "text": string,
      "sentiment": "Positif"|"Negatif"|"Netral",
      "score": number,
      "theme": string
    }
  ],
  "recommendations": string[]
}

Komentar:
${comments.map(c => `- ${c.username}: ${c.text}`).join('\n')}`
        }]
      };
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
      model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      apiUrl = "https://api.openai.com/v1/chat/completions";
      headers = {
        "Authorization": `Bearer ${apiKey}`,
        "content-type": "application/json"
      };
      body = {
        model: model,
        messages: [{
          role: "user",
          content: `Analisis sentimen dari komentar-komentar berikut. Berikan output dalam format JSON dengan struktur:
{
  "summary": {
    "total": number,
    "positive": number,
    "negative": number,
    "neutral": number
  },
  "comments": [
    {
      "username": string,
      "text": string,
      "sentiment": "Positif"|"Negatif"|"Netral",
      "score": number,
      "theme": string
    }
  ],
  "recommendations": string[]
}

Komentar:
${comments.map(c => `- ${c.username}: ${c.text}`).join('\n')}`
        }]
      };
    } else {
      throw new Error("AI_PROVIDER tidak valid. Gunakan 'anthropic' atau 'openai'");
    }

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()}_API_KEY belum diisi di Environment Variables.`);
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || `AI API error ${res.status}`);
    }

    let aiResponse;
    if (provider === "anthropic") {
      aiResponse = data.content[0].text;
    } else {
      aiResponse = data.choices[0].message.content;
    }

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response tidak mengandung JSON yang valid");
    }

    const result = JSON.parse(jsonMatch[0]);

    return json(200, {
      ok: true,
      ...result
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
