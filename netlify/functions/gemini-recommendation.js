// System instruction for Sylor AI
const SYSTEM_INSTRUCTION = `Anda adalah Senior Digital Marketing Strategist dan Social Media Analyst.

Anda menerima hasil klasifikasi sentimen yang diproses menggunakan TF-IDF dan Multinomial Naive Bayes.

Tugas Anda bukan mengulang angka sentimen, melainkan mengubah hasil analisis menjadi rekomendasi yang praktis dan relevan.

Gunakan hanya data pada input.

Pisahkan dengan jelas:
1. Temuan berdasarkan data.
2. Interpretasi.
3. Strategi.
4. Ide konten.
5. Keterbatasan data.

Jangan mengarang demografi, waktu posting terbaik, tren historis, atau performa kompetitor apabila datanya tidak tersedia.

Hasilkan tepat:
- satu ringkasan eksekutif (maksimal 120 kata);
- maksimal tiga insight utama;
- maksimal tiga strategi konten;
- tepat tiga ide konten;
- maksimal tiga tindakan prioritas.

Setiap rekomendasi harus memiliki dasar data.

Gunakan Bahasa Indonesia profesional.

Kembalikan hanya JSON valid tanpa Markdown dan tanpa code fence.

Output harus mengikuti struktur:
{
  "executive_summary": "",
  "key_insights": [
    {
      "finding": "",
      "data_basis": "",
      "interpretation": ""
    }
  ],
  "content_strategy": [
    {
      "title": "",
      "objective": "",
      "recommendation": "",
      "data_basis": "",
      "priority": "High | Medium | Low"
    }
  ],
  "content_ideas": [
    {
      "title": "",
      "format": "Reels | Carousel | Story | Single Post",
      "objective": "",
      "concept": "",
      "hook": "",
      "caption_angle": "",
      "call_to_action": "",
      "data_basis": ""
    }
  ],
  "priority_actions": [
    {
      "priority_number": 1,
      "action": "",
      "reason": "",
      "success_metric": ""
    }
  ],
  "limitations": []
}

Ketentuan:
- content_ideas harus tepat 3.
- key_insights maksimal 3.
- content_strategy maksimal 3.
- priority_actions maksimal 3.
- executive_summary maksimal 120 kata.
- Jangan menghasilkan field di luar schema.
- Jangan mengembalikan Markdown.`;

// JSON Schema for structured output
const RECOMMENDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "executive_summary",
    "key_insights",
    "content_strategy",
    "content_ideas",
    "priority_actions",
    "limitations"
  ],
  properties: {
    executive_summary: {
      type: "string",
      description: "Ringkasan singkat maksimal 120 kata"
    },
    key_insights: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["finding", "data_basis", "interpretation"],
        properties: {
          finding: { type: "string" },
          data_basis: { type: "string" },
          interpretation: { type: "string" }
        }
      }
    },
    content_strategy: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "objective", "recommendation", "data_basis", "priority"],
        properties: {
          title: { type: "string" },
          objective: { type: "string" },
          recommendation: { type: "string" },
          data_basis: { type: "string" },
          priority: { type: "string", enum: [" High", "Medium", "Low"] }
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
        required: ["title", "format", "objective", "concept", "hook", "caption_angle", "call_to_action", "data_basis"],
        properties: {
          title: { type: "string" },
          format: { type: "string", enum: ["Reels", "Carousel", "Story", "Single Post"] },
          objective: { type: "string" },
          concept: { type: "string" },
          hook: { type: "string" },
          caption_angle: { type: "string" },
          call_to_action: { type: "string" },
          data_basis: { type: "string" }
        }
      }
    },
    priority_actions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority_number", "action", "reason", "success_metric"],
        properties: {
          priority_number: { type: "number" },
          action: { type: "string" },
          reason: { type: "string" },
          success_metric: { type: "string" }
        }
      }
    },
    limitations: {
      type: "array",
      items: { type: "string" }
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
async function makeRequest(url, options, data) {
  try {
    console.log('=== Sylor API Request ===');
    console.log('Endpoint:', url);
    console.log('Method:', options.method);
    console.log('Headers:', JSON.stringify(options.headers, (key, value) => key === 'Authorization' ? '***' : value));
    console.log('Body length:', data ? JSON.stringify(data).length : 0);
    console.log('Body preview:', data ? JSON.stringify(data).substring(0, 500) : 'N/A');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('=== Sylor API Response ===');
    console.log('HTTP Status:', response.status);
    console.log('HTTP Status Text:', response.statusText);
    console.log('Response OK:', response.ok);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const body = await response.text();
    console.log('Response body length:', body.length);
    
    if (!response.ok) {
      console.log('Response body (first 1000 chars):', body.substring(0, 1000));
      
      // Check if response is HTML
      if (body.trim().startsWith('<') || body.includes('<html') || body.includes('<HTML')) {
        console.error('=== HTML RESPONSE DETECTED ===');
        console.error('HTML response (first 1000 chars):', body.substring(0, 1000));
        console.error('This indicates the API endpoint may be incorrect or the API is down');
        throw new Error(`Sylor API returned HTML error page. Status: ${response.status}. This usually means the endpoint is incorrect or the API is down. Response: ${body.substring(0, 200)}`);
      }
    }
    
    try {
      const parsed = JSON.parse(body);
      
      if (response.ok) {
        return parsed;
      } else {
        const sylorError = parsed.error?.message || parsed.error || `HTTP ${response.status}`;
        console.error('Sylor API Error:', sylorError);
        throw new Error(sylorError);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error('=== JSON PARSE ERROR ===');
        console.error('Response body (first 500 chars):', body.substring(0, 500));
        throw new Error(`Invalid JSON response from Sylor API. Response: ${body.substring(0, 200)}`);
      }
      throw e;
    }
  } catch (error) {
    console.error('=== Request Error ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
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

// Validate input payload
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
  
  // Validate account if present
  if (data.account && typeof data.account !== 'object') {
    errors.push('account must be an object');
  }
  
  // Validate sentiment if present
  if (data.sentiment && typeof data.sentiment !== 'object') {
    errors.push('sentiment must be an object');
  }
  
  // Validate performance if present
  if (data.performance && typeof data.performance !== 'object') {
    errors.push('performance must be an object');
  }
  
  // Limit representative comments
  if (data.sentiment && data.sentiment.representative_comments) {
    if (data.sentiment.representative_comments.length > 50) {
      data.sentiment.representative_comments = data.sentiment.representative_comments.slice(0, 50);
      console.log('Limited representative comments to 50');
    }
    
    // Truncate comment text
    data.sentiment.representative_comments = data.sentiment.representative_comments.map(comment => ({
      ...comment,
      text: comment.text ? comment.text.substring(0, 500) : ''
    }));
  }
  
  return { valid: errors.length === 0, errors };
}

// Netlify Function handler
exports.handler = async (event, context) => {
  console.log('=== Sylor AI Recommendation Function Started ===');
  console.log('Function: gemini-recommendation');
  console.log('HTTP Method:', event.httpMethod);
  
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
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.sylorapi.com').replace(/\/+$/, '');
  
  // Allowed models
  const allowedModels = ['gpt-5.6-luna', 'gpt-5.6-terra'];
  
  // Fallback model list
  const fallbackModels = [
    configuredModel,
    ...allowedModels
  ].filter(m => m && allowedModels.includes(m));
  
  console.log('Environment Check:');
  console.log('  hasApiKey:', !!apiKey);
  console.log('  keyLength:', apiKey ? apiKey.length : 0);
  console.log('  configuredModel:', configuredModel);
  console.log('  fallbackModels:', fallbackModels);
  console.log('  baseUrl:', baseUrl);
  
  if (!apiKey) {
    console.log('ERROR: OPENAI_API_KEY is not configured');
    return jsonResponse(500, {
      success: false,
      code: 'API_KEY_MISSING',
      message: 'API key AI belum dikonfigurasi pada server.',
      details: {
        hasApiKey: false,
        keyLength: 0
      }
    });
  }
  
  if (!configuredModel) {
    console.log('ERROR: OPENAI_MODEL is not configured');
    return jsonResponse(500, {
      success: false,
      code: 'MODEL_MISSING',
      message: 'Model AI belum dikonfigurasi pada server.',
      details: {
        model: null,
        allowedModels: allowedModels
      }
    });
  }
  
  if (!allowedModels.includes(configuredModel)) {
    console.log('ERROR: Model not allowed:', configuredModel);
    return jsonResponse(500, {
      success: false,
      code: 'MODEL_NOT_ALLOWED',
      message: `Model ${configuredModel} tidak termasuk model yang diizinkan.`,
      details: {
        configuredModel: configuredModel,
        allowedModels: allowedModels
      }
    });
  }
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Request data parsed successfully');
    } catch (e) {
      console.log('ERROR: Invalid JSON in request body', e.message);
      return jsonResponse(400, { 
        success: false,
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body' 
      });
    }
    
    // Validate input payload
    const validation = validateInputPayload(requestData);
    if (!validation.valid) {
      console.log('ERROR: Validation failed', validation.errors);
      return jsonResponse(400, { 
        success: false,
        code: 'INVALID_PAYLOAD',
        message: validation.errors[0] || 'Data analisis tidak valid',
        details: {
          errors: validation.errors
        }
      });
    }
    console.log('Request validation passed');
    
    // Build input for Sylor API
    const inputPayload = JSON.stringify(requestData);
    console.log('Input payload length:', inputPayload.length);
    
    console.log('Calling Sylor API...');
    console.log('Base URL:', baseUrl);
    console.log('Input payload length:', inputPayload.length);
    
    // Try each model in the fallback list using OpenAI-style endpoint (more common)
    let sylorResponse;
    let useAnthropicFormat = false; // Use OpenAI-style by default
    let successfulModel = null;
    let lastError = null;
    
    for (const modelToTry of fallbackModels) {
      console.log(`=== Trying model: ${modelToTry} ===`);
      
      try {
        // Use OpenAI-style endpoint (more commonly supported)
        const openaiUrl = `${baseUrl}/v1/chat/completions`;
        
        const requestBody = {
          model: modelToTry,
          max_tokens: 6000,
          messages: [
            {
              role: 'system',
              content: SYSTEM_INSTRUCTION
            },
            {
              role: 'user',
              content: `Berdasarkan data analisis media sosial berikut, berikan rekomendasi yang spesifik dan actionable dalam format JSON sesuai schema:\n\n${inputPayload}`
            }
          ]
        };
        
        console.log(`Request URL: ${openaiUrl}`);
        console.log(`Request body length: ${JSON.stringify(requestBody).length}`);
        
        sylorResponse = await makeRequest(openaiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }, requestBody);
        
        successfulModel = modelToTry;
        console.log(`✓ Successfully connected with model: ${modelToTry} (OpenAI-style format)`);
        break; // Success, exit loop
      } catch (e) {
        lastError = e;
        console.log(`✗ Model ${modelToTry} failed:`, e.message);
        continue; // Try next model
      }
    }
    
    // If all models failed with OpenAI-style, try anthropic-messages as last resort
    if (!successfulModel && fallbackModels.length > 0) {
      console.log('=== All OpenAI-style attempts failed. Trying anthropic-messages format as last resort ===');
      
      for (const modelToTry of fallbackModels) {
        console.log(`Trying anthropic-messages with model: ${modelToTry}`);
        
        try {
          const sylorUrl = `${baseUrl}/v1/messages`;
          
          const requestBody = {
            model: modelToTry,
            max_tokens: 6000,
            system: SYSTEM_INSTRUCTION,
            messages: [
              {
                role: 'user',
                content: `Berdasarkan data analisis media sosial berikut, berikan rekomendasi yang spesifik dan actionable dalam format JSON sesuai schema:\n\n${inputPayload}`
              }
            ]
          };
          
          sylorResponse = await makeRequest(sylorUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'anthropic-version': '2023-06-01'
            }
          }, requestBody);
          
          successfulModel = modelToTry;
          useAnthropicFormat = true;
          console.log(`✓ Successfully connected with model: ${modelToTry} (anthropic-messages format)`);
          break; // Success, exit loop
        } catch (e) {
          lastError = e;
          console.log(`✗ anthropic-messages with model ${modelToTry} failed:`, e.message);
          continue;
        }
      }
    }
    
    // If all models failed
    if (!successfulModel) {
      console.error('All models failed. Last error:', lastError?.message);
      return jsonResponse(500, { 
        success: false,
        code: 'ALL_MODELS_FAILED',
        message: `All models failed. Last error: ${lastError?.message || 'Unknown error'}`,
        attemptedModels: fallbackModels
      });
    }
    
    console.log(`Successfully used model: ${successfulModel}`);
    console.log('Response body:', JSON.stringify(sylorResponse).substring(0, 500));
    
    // Parse response based on format
    let outputText;
    if (useAnthropicFormat) {
      // Anthropic format
      if (sylorResponse.content && Array.isArray(sylorResponse.content)) {
        const textBlock = sylorResponse.content.find(block => block.type === 'text');
        if (textBlock && textBlock.text) {
          outputText = textBlock.text;
        }
      }
    } else {
      // OpenAI format
      if (sylorResponse.choices && sylorResponse.choices[0] && sylorResponse.choices[0].message) {
        outputText = sylorResponse.choices[0].message.content;
      }
    }
    
    if (!outputText) {
      console.error('No text content in response');
      return jsonResponse(500, { 
        success: false,
        code: 'EMPTY_RESPONSE',
        message: 'No text content in response' 
      });
    }
    
    console.log('Output text length:', outputText.length);
    
    // Parse JSON
    let parsedResponse;
    try {
      parsedResponse = safeParseJSON(outputText);
      console.log('JSON parsed successfully');
    } catch (e) {
      console.error('JSON parsing error:', e.message);
      return jsonResponse(500, { 
        success: false,
        code: 'INVALID_JSON',
        message: `Response is not valid JSON: ${e.message}` 
      });
    }
    
    // Return success response
    return jsonResponse(200, {
      success: true,
      data: parsedResponse
    });
    
  } catch (error) {
    console.error('=== Sylor AI Recommendation Error ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Model used:', configuredModel);
    console.error('Base URL:', baseUrl);
    
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'Failed to generate recommendation';
    
    if (error.message.includes('HTML') || error.message.includes('Sylor API returned HTML')) {
      errorCode = 'API_ENDPOINT_ERROR';
      errorMessage = 'Sylor API endpoint tidak valid atau API sedang down. Periksa OPENAI_BASE_URL dan coba lagi.';
    } else if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
      errorCode = 'AUTH_FAILED';
      errorMessage = 'API key invalid atau tidak memiliki akses';
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      errorCode = 'QUOTA_EXCEEDED';
      errorMessage = 'Kuota API telah mencapai batas';
    } else if (error.message.includes('timeout') || error.name === 'AbortError') {
      errorCode = 'TIMEOUT';
      errorMessage = 'Request ke API timeout';
    } else if (error.message.includes('model') || error.message.includes('404')) {
      errorCode = 'MODEL_NOT_FOUND';
      errorMessage = `Model ${configuredModel} tidak tersedia`;
    } else if (error.message.includes('parameter') || error.message.includes('unsupported')) {
      errorCode = 'UNSUPPORTED_PARAMETER';
      errorMessage = 'Parameter tidak didukung oleh model';
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorCode = 'NETWORK_ERROR';
      errorMessage = 'Gagal melakukan request ke API';
    } else if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
      errorCode = 'BAD_GATEWAY';
      errorMessage = 'Sylor API sedang mengalami gangguan atau tidak merespons';
    } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
      errorCode = 'SERVICE_UNAVAILABLE';
      errorMessage = 'Sylor API sedang tidak tersedia';
    }
    
    console.log('Error code:', errorCode);
    
    return jsonResponse(500, { 
      success: false,
      code: errorCode,
      message: errorMessage,
      details: error.message,
      model: configuredModel,
      baseUrl: baseUrl
    });
  }
};
