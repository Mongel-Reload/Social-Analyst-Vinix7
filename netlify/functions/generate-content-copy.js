// Netlify Function for AI Caption and Hashtag Generation using Sylor API
// Provider: Sylor API (OpenAI-compatible chat completions)
// Reuses existing AI provider configuration

const SYSTEM_INSTRUCTION = `Anda adalah Social Media Copywriter profesional.

Tugas Anda adalah membuat caption Instagram dan hashtag berdasarkan rekomendasi konten yang diberikan.

Kembalikan hanya JSON valid tanpa Markdown.

Struktur wajib:
{
  "caption": "...",
  "hashtags": ["#...", "#..."]
}

Ketentuan caption:
- Bahasa Indonesia
- Natural dan engaging
- Ada hook di awal
- Relevan dengan recommendation
- Profesional tapi tidak kaku
- Ada call-to-action sesuai rekomendasi
- Jangan mengarang data atau fakta
- Jangan menyebut AI
- Panjang 80-150 kata

Ketentuan hashtag:
- 8-15 hashtag
- Relevan dengan recommendation dan konteks
- Kombinasi broad + niche + contextual
- Jangan spam
- Format: #Hashtag (tanpa spasi dalam satu hashtag)`;

// JSON Schema for structured output
const COPY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["caption", "hashtags"],
  properties: {
    caption: {
      type: "string",
      description: "Caption Instagram dalam Bahasa Indonesia"
    },
    hashtags: {
      type: "array",
      minItems: 8,
      maxItems: 15,
      items: {
        type: "string",
        description: "Hashtag dengan format #Hashtag"
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

// Helper function to make HTTPS request using fetch
async function makeRequest(url, options, data, startedAt) {
  try {
    console.log({
      stage: 'provider_request_started',
      elapsedMs: Date.now() - startedAt,
      url,
      payloadBytes: data ? JSON.stringify(data).length : 0
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
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
      bodyLength: body.length,
      bodyPreview: body.substring(0, 500)
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
      error.httpStatus = response.status;
      error.responseBody = body;
      throw error;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const error = new Error(`Non-JSON response: ${contentType}`);
      error.httpStatus = response.status;
      error.responseBody = body;
      error.contentType = contentType;
      throw error;
    }
    
    try {
      const parsed = JSON.parse(body);
      console.log({
        stage: 'provider_json_parsed',
        elapsedMs: Date.now() - startedAt
      });
      return parsed;
    } catch (e) {
      const error = new Error('Invalid JSON response');
      error.httpStatus = response.status;
      error.responseBody = body;
      throw error;
    }
  } catch (error) {
    console.log({
      stage: 'request_error',
      elapsedMs: Date.now() - startedAt,
      error: error.message,
      errorName: error.name,
      errorType: error.constructor.name
    });
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.httpStatus = 504;
      throw timeoutError;
    }
    
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('ENOTFOUND') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('getaddrinfo') ||
        error.message.includes('fetch failed')) {
      const networkError = new Error(`Network error: ${error.message}`);
      networkError.httpStatus = 503;
      networkError.responseBody = error.message;
      throw networkError;
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

// Netlify Function handler
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
  
  // Validate environment variables
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.sylorapi.com/v1').replace(/\/+$/, '');
  const chatEndpoint = (process.env.OPENAI_CHAT_ENDPOINT || '/chat/completions').replace(/^\/+/, '');
  
  if (!configuredModel) {
    console.log({ stage: 'model_missing', elapsedMs: Date.now() - startedAt });
    return jsonResponse(500, {
      success: false,
      code: 'MODEL_MISSING',
      message: 'OPENAI_MODEL environment variable belum dikonfigurasi.'
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
  
  console.log({ stage: 'env_validated', elapsedMs: Date.now() - startedAt, model: configuredModel, baseUrl, chatEndpoint });
  
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
    
    // Validate required fields
    if (!requestData.recommendation || typeof requestData.recommendation !== 'object') {
      return jsonResponse(400, {
        success: false,
        code: 'INVALID_PAYLOAD',
        message: 'Recommendation object is required'
      });
    }
    
    // Build prompt from recommendation
    const rec = requestData.recommendation;
    const promptContext = `
Rekomendasi Konten:
Title: ${rec.title || 'N/A'}
Concept: ${rec.concept || 'N/A'}
Format: ${rec.format || 'N/A'}
Call to Action: ${rec.call_to_action || 'N/A'}
Data Basis: ${rec.data_basis || 'N/A'}

${requestData.sentimentContext ? `
Konteks Sentimen:
${requestData.sentimentContext}
` : ''}

Buat caption Instagram dan hashtag yang relevan dengan rekomendasi di atas.`;
    
    const inputPayload = JSON.stringify({ recommendation: rec, sentimentContext: requestData.sentimentContext });
    const payloadBytes = inputPayload.length;
    console.log({ stage: 'payload_validated', elapsedMs: Date.now() - startedAt, payloadBytes });
    
    // Construct URL
    const sylorUrl = `${baseUrl}/${chatEndpoint}`;
    
    const requestBody = {
      model: configuredModel,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: SYSTEM_INSTRUCTION
        },
        {
          role: 'user',
          content: promptContext
        }
      ]
    };
    
    console.log({ stage: 'calling_provider', elapsedMs: Date.now() - startedAt, url: sylorUrl });
    
    let sylorResponse;
    try {
      sylorResponse = await makeRequest(sylorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }, requestBody, startedAt);
    } catch (error) {
      console.log({ 
        stage: 'provider_request_failed', 
        elapsedMs: Date.now() - startedAt, 
        error: error.message,
        httpStatus: error.httpStatus,
        responseBody: error.responseBody?.substring(0, 500),
        errorName: error.name
      });
      
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return jsonResponse(504, {
          success: false,
          code: 'PROVIDER_TIMEOUT',
          message: 'Provider AI membutuhkan waktu terlalu lama untuk menghasilkan caption.'
        });
      }
      
      if (error.httpStatus === 503 || error.message.includes('Network error')) {
        return jsonResponse(503, {
          success: false,
          code: 'NETWORK_ERROR',
          message: 'Gagal terhubung ke provider AI. Periksa koneksi internet atau konfigurasi API.',
          details: {
            error: error.message,
            baseUrl: baseUrl
          }
        });
      }
      
      if (error.message.includes('Non-JSON')) {
        return jsonResponse(502, {
          success: false,
          code: 'PROVIDER_NON_JSON',
          message: 'Provider AI mengembalikan format yang tidak sesuai.',
          details: {
            contentType: error.contentType || 'Unknown',
            responseSnippet: error.responseBody?.substring(0, 500) || 'Unknown'
          }
        });
      }
      
      return jsonResponse(502, {
        success: false,
        code: 'PROVIDER_ERROR',
        message: 'Provider AI gagal memproses permintaan.',
        details: { 
          error: error.message,
          httpStatus: error.httpStatus || 'Unknown',
          responseSnippet: error.responseBody?.substring(0, 200) || 'N/A'
        },
        baseUrl: baseUrl,
        model: configuredModel
      });
    }
    
    // Parse OpenAI-style format response
    let outputText;
    if (sylorResponse.choices && Array.isArray(sylorResponse.choices) && sylorResponse.choices.length > 0) {
      const choice = sylorResponse.choices[0];
      if (choice.message && choice.message.content) {
        outputText = choice.message.content;
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
      console.log({ stage: 'copy_parsed', elapsedMs: Date.now() - startedAt });
    } catch (e) {
      console.log({ stage: 'json_parse_failed', elapsedMs: Date.now() - startedAt, error: e.message });
      return jsonResponse(500, { 
        success: false,
        code: 'INVALID_JSON',
        message: `Response is not valid JSON: ${e.message}` 
      });
    }
    
    // Validate output structure
    if (!parsedResponse.caption || typeof parsedResponse.caption !== 'string') {
      return jsonResponse(500, {
        success: false,
        code: 'INVALID_OUTPUT',
        message: 'Output harus memiliki field caption yang valid'
      });
    }
    
    if (!parsedResponse.hashtags || !Array.isArray(parsedResponse.hashtags) || parsedResponse.hashtags.length < 8) {
      return jsonResponse(500, {
        success: false,
        code: 'INVALID_OUTPUT',
        message: 'Output harus memiliki minimal 8 hashtag'
      });
    }
    
    console.log({ stage: 'response_returned', elapsedMs: Date.now() - startedAt });
    
    return jsonResponse(200, {
      success: true,
      data: {
        caption: parsedResponse.caption,
        hashtags: parsedResponse.hashtags.join(' ')
      }
    });
    
  } catch (error) {
    console.log({ stage: 'internal_error', elapsedMs: Date.now() - startedAt, error: error.message });
    
    if (error.name === 'AbortError') {
      return jsonResponse(504, {
        success: false,
        code: 'PROVIDER_TIMEOUT',
        message: 'Provider AI membutuhkan waktu terlalu lama untuk menghasilkan caption.'
      });
    }
    
    return jsonResponse(500, {
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan pada layanan pembuatan caption.'
    });
  }
};
