// System instruction for Sylor AI (ringkas)
const SYSTEM_INSTRUCTION = `Anda adalah Social Media Strategist.

Gunakan hasil klasifikasi sentimen TF-IDF dan Multinomial Naive Bayes yang diberikan.

Jangan mengulang seluruh angka analisis.
Hasilkan rekomendasi singkat dan praktis berdasarkan data.

Kembalikan hanya JSON valid tanpa Markdown.

Struktur wajib:
{
  "executive_summary": "",
  "key_insights": [],
  "content_ideas": [],
  "priority_actions": []
}

Ketentuan:
- executive_summary maksimal 80 kata;
- key_insights tepat 3;
- content_ideas tepat 3;
- priority_actions tepat 3;
- setiap rekomendasi harus memiliki data_basis;
- jangan mengarang data yang tidak tersedia.`;

// JSON Schema for structured output (ringkas)
const RECOMMENDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "executive_summary",
    "key_insights",
    "content_ideas",
    "priority_actions"
  ],
  properties: {
    executive_summary: {
      type: "string",
      description: "Ringkasan singkat maksimal 80 kata"
    },
    key_insights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["insight", "data_basis"],
        properties: {
          insight: { type: "string" },
          data_basis: { type: "string" }
        }
      }
    },
    content_ideas: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "format", "concept", "call_to_action", "data_basis"],
        properties: {
          title: { type: "string" },
          format: { type: "string", enum: ["Reels", "Carousel", "Story", "Single Post"] },
          concept: { type: "string" },
          call_to_action: { type: "string" },
          data_basis: { type: "string" }
        }
      }
    },
    priority_actions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "reason", "success_metric"],
        properties: {
          action: { type: "string" },
          reason: { type: "string" },
          success_metric: { type: "string" }
        }
      }
    }
  }
};

// Helper function for JSON responses
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

// Helper function to make HTTPS request using fetch (ringkas, timeout 20 detik)
async function makeRequest(url, options, data, startedAt) {
  try {
    console.log({
      stage: 'provider_request_started',
      elapsedMs: Date.now() - startedAt,
      url,
      payloadBytes: data ? JSON.stringify(data).length : 0
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log({
      stage: 'provider_headers_received',
      elapsedMs: Date.now() - startedAt,
      status: response.status,
      contentType: response.headers.get('content-type')
    });
    
    const body = await response.text();
    
    console.log({
      stage: 'provider_body_received',
      elapsedMs: Date.now() - startedAt,
      bodyLength: body.length
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Non-JSON response: ${contentType}`);
    }
    
    try {
      const parsed = JSON.parse(body);
      console.log({
        stage: 'provider_json_parsed',
        elapsedMs: Date.now() - startedAt
      });
      return parsed;
    } catch (e) {
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Safe JSON parser
function safeParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text is empty or not a string');
  }
  
  text = text.trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        throw new Error('Failed to parse JSON from markdown code block');
      }
    }
    
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e3) {
        throw new Error('Failed to parse JSON from curly braces');
      }
    }
    
    throw new Error('No valid JSON found in response');
  }
}

// Validate input payload (ringkas: maksimal 3 komentar per kelas, 250 char)
function validateInputPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] };
  }
  
  const errors = [];
  
  // Check if payload is empty
  if (!data.account && !data.sentiment && !data.performance) {
    return {
      valid: false,
      errors: ['Data analisis belum tersedia untuk menghasilkan rekomendasi.']
    };
  }
  
  // Limit representative comments to 3 per class, 250 chars
  if (data.sentiment && data.sentiment.representative_comments) {
    const comments = data.sentiment.representative_comments;
    
    // Limit to 3 comments per sentiment class
    if (comments.positive && comments.positive.length > 3) {
      comments.positive = comments.positive.slice(0, 3);
    }
    if (comments.neutral && comments.neutral.length > 3) {
      comments.neutral = comments.neutral.slice(0, 3);
    }
    if (comments.negative && comments.negative.length > 3) {
      comments.negative = comments.negative.slice(0, 3);
    }
    
    // Truncate comment text to 250 chars
    if (comments.positive) {
      comments.positive = comments.positive.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    if (comments.neutral) {
      comments.neutral = comments.neutral.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    if (comments.negative) {
      comments.negative = comments.negative.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    
    console.log('Limited comments to 3 per class, 250 chars each');
  }
  
  // Limit frequent terms to 5 per class
  if (data.frequent_terms) {
    if (data.frequent_terms.positive && data.frequent_terms.positive.length > 5) {
      data.frequent_terms.positive = data.frequent_terms.positive.slice(0, 5);
    }
    if (data.frequent_terms.neutral && data.frequent_terms.neutral.length > 5) {
      data.frequent_terms.neutral = data.frequent_terms.neutral.slice(0, 5);
    }
    if (data.frequent_terms.negative && data.frequent_terms.negative.length > 5) {
      data.frequent_terms.negative = data.frequent_terms.negative.slice(0, 5);
    }
  }
  
  // Limit top/low content to 3
  if (data.top_content && data.top_content.length > 3) {
    data.top_content = data.top_content.slice(0, 3);
  }
  if (data.low_performing_content && data.low_performing_content.length > 3) {
    data.low_performing_content = data.low_performing_content.slice(0, 3);
  }
  
  return { valid: errors.length === 0, errors };
}

// Netlify Function handler (ringkas, tanpa retry, hanya gpt-5.6-luna)
exports.handler = async (event, context) => {
  const startedAt = Date.now();
  console.log({ stage: 'function_started', elapsedMs: 0 });
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { 
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed' 
    });
  }
  
  // Validate environment variables (hanya gpt-5.6-luna)
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const configuredModel = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna';
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.sylorapi.com').replace(/\/+$/, '');
  
  // Hanya izinkan gpt-5.6-luna
  if (configuredModel !== 'gpt-5.6-luna') {
    console.log({ stage: 'model_validation_failed', elapsedMs: Date.now() - startedAt, model: configuredModel });
    return jsonResponse(500, {
      success: false,
      code: 'MODEL_NOT_ALLOWED',
      message: 'Hanya model gpt-5.6-luna yang diizinkan untuk mengurangi latency.',
      details: { configuredModel }
    });
  }
  
  if (!apiKey) {
    console.log({ stage: 'api_key_missing', elapsedMs: Date.now() - startedAt });
    return jsonResponse(500, {
      success: false,
      code: 'API_KEY_MISSING',
      message: 'API key AI belum dikonfigurasi pada server.'
    });
  }
  
  console.log({ stage: 'env_validated', elapsedMs: Date.now() - startedAt, model: configuredModel });
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log({ stage: 'request_parsed', elapsedMs: Date.now() - startedAt });
    } catch (e) {
      return jsonResponse(400, { 
        success: false,
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body' 
      });
    }
    
    // Validate and lighten payload
    const validation = validateInputPayload(requestData);
    if (!validation.valid) {
      console.log({ stage: 'payload_validation_failed', elapsedMs: Date.now() - startedAt, errors: validation.errors });
      return jsonResponse(400, { 
        success: false,
        code: 'INVALID_PAYLOAD',
        message: validation.errors[0] || 'Data analisis tidak valid'
      });
    }
    
    const inputPayload = JSON.stringify(requestData);
    const payloadBytes = inputPayload.length;
    console.log({ stage: 'payload_validated', elapsedMs: Date.now() - startedAt, payloadBytes });
    
    // Check payload size (target < 15 KB)
    if (payloadBytes > 15000) {
      console.log({ stage: 'payload_too_large', elapsedMs: Date.now() - startedAt, payloadBytes });
      return jsonResponse(400, {
        success: false,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload terlalu besar. Batas maksimal 15 KB.',
        details: { payloadBytes }
      });
    }
    
    // Gunakan endpoint anthropic-messages (format Sylor)
    const sylorUrl = `${baseUrl}/v1/messages`;
    
    const requestBody = {
      model: configuredModel,
      max_tokens: 900, // Dikurangi dari 6000
      system: SYSTEM_INSTRUCTION,
      messages: [
        {
          role: 'user',
          content: `Berdasarkan data analisis media sosial berikut, berikan rekomendasi yang spesifik dan actionable dalam format JSON sesuai schema:\n\n${inputPayload}`
        }
      ]
    };
    
    console.log({ stage: 'calling_provider', elapsedMs: Date.now() - startedAt, url: sylorUrl });
    
    // Single request, no retry
    let sylorResponse;
    try {
      sylorResponse = await makeRequest(sylorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'anthropic-version': '2023-06-01'
        }
      }, requestBody, startedAt);
    } catch (error) {
      console.log({ stage: 'provider_request_failed', elapsedMs: Date.now() - startedAt, error: error.message });
      
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return jsonResponse(504, {
          success: false,
          code: 'PROVIDER_TIMEOUT',
          message: 'Provider AI membutuhkan waktu terlalu lama untuk menghasilkan rekomendasi.'
        });
      }
      
      if (error.message.includes('Non-JSON')) {
        return jsonResponse(502, {
          success: false,
          code: 'PROVIDER_NON_JSON',
          message: 'Provider AI mengembalikan format yang tidak sesuai.'
        });
      }
      
      return jsonResponse(502, {
        success: false,
        code: 'PROVIDER_ERROR',
        message: 'Provider AI gagal memproses permintaan.',
        details: { error: error.message }
      });
    }
    
    // Parse Anthropic format response
    let outputText;
    if (sylorResponse.content && Array.isArray(sylorResponse.content)) {
      const textBlock = sylorResponse.content.find(block => block.type === 'text');
      if (textBlock && textBlock.text) {
        outputText = textBlock.text;
      }
    }
    
    if (!outputText) {
      console.log({ stage: 'empty_response', elapsedMs: Date.now() - startedAt });
      return jsonResponse(500, { 
        success: false,
        code: 'EMPTY_RESPONSE',
        message: 'No text content in response' 
      });
    }
    
    // Parse JSON
    let parsedResponse;
    try {
      parsedResponse = safeParseJSON(outputText);
      console.log({ stage: 'recommendation_parsed', elapsedMs: Date.now() - startedAt });
    } catch (e) {
      console.log({ stage: 'json_parse_failed', elapsedMs: Date.now() - startedAt, error: e.message });
      return jsonResponse(500, { 
        success: false,
        code: 'INVALID_JSON',
        message: `Response is not valid JSON: ${e.message}` 
      });
    }
    
    // Validate output has exactly 3 items each
    if (!parsedResponse.key_insights || parsedResponse.key_insights.length !== 3) {
      return jsonResponse(500, {
        success: false,
        code: 'INVALID_OUTPUT',
        message: 'Output harus memiliki tepat 3 key_insights'
      });
    }
    if (!parsedResponse.content_ideas || parsedResponse.content_ideas.length !== 3) {
      return jsonResponse(500, {
        success: false,
        code: 'INVALID_OUTPUT',
        message: 'Output harus memiliki tepat 3 content_ideas'
      });
    }
    if (!parsedResponse.priority_actions || parsedResponse.priority_actions.length !== 3) {
      return jsonResponse(500, {
        success: false,
        code: 'INVALID_OUTPUT',
        message: 'Output harus memiliki tepat 3 priority_actions'
      });
    }
    
    console.log({ stage: 'response_returned', elapsedMs: Date.now() - startedAt });
    
    return jsonResponse(200, {
      success: true,
      data: parsedResponse
    });
    
  } catch (error) {
    console.log({ stage: 'internal_error', elapsedMs: Date.now() - startedAt, error: error.message });
    
    if (error.name === 'AbortError') {
      return jsonResponse(504, {
        success: false,
        code: 'PROVIDER_TIMEOUT',
        message: 'Provider AI membutuhkan waktu terlalu lama untuk menghasilkan rekomendasi.'
      });
    }
    
    return jsonResponse(500, {
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan pada layanan rekomendasi.'
    });
  }
};
