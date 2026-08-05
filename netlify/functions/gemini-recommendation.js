// System instruction for Sylor AI
const SYSTEM_INSTRUCTION = `Anda adalah Senior Digital Marketing Strategist, Social Media Analyst, Content Planner, dan Marketing Performance Consultant.

Tugas Anda bukan sekadar mengulang data analisis sentimen.

Anda harus mengubah data media sosial menjadi rekomendasi yang praktis, spesifik, dapat dilaksanakan, terukur, dan relevan dengan konteks akun.

Gunakan hanya data yang tersedia pada input.

Bedakan dengan jelas antara:

1. Temuan yang didukung data.
2. Interpretasi berdasarkan data.
3. Rekomendasi strategis.
4. Hal yang belum dapat disimpulkan karena data tidak tersedia.

Jangan mengarang:
- demografi audiens;
- jam terbaik;
- peningkatan persentase;
- target pertumbuhan;
- tren historis;
- performa platform;
- karakter audiens;
- data kompetitor;

apabila data tersebut tidak diberikan.

Setiap strategi dan ide konten harus memiliki \`data_basis\`.

Jika data terbatas, tetap berikan ide yang relevan, tetapi tuliskan bahwa ide tersebut merupakan hipotesis yang perlu diuji.

Rekomendasi harus mencakup:
- ide konten;
- strategi engagement;
- strategi campaign;
- strategi pertumbuhan;
- rekomendasi format;
- prioritas tindakan;
- indikator keberhasilan.

Gunakan Bahasa Indonesia yang profesional, jelas, dan mudah dipahami.

Jangan menulis Markdown.

Kembalikan output hanya sesuai JSON Schema.`;

// JSON Schema for structured output
const RECOMMENDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "executive_summary",
    "sentiment_evaluation",
    "data_insights",
    "content_strategy",
    "content_ideas",
    "campaign_recommendations",
    "engagement_strategy",
    "posting_schedule",
    "growth_opportunities",
    "priority_actions",
    "limitations"
  ],
  properties: {
    executive_summary: {
      type: "string",
      description: "Ringkasan eksekutif kondisi akun secara keseluruhan"
    },
    sentiment_evaluation: {
      type: "object",
      additionalProperties: false,
      required: ["overall_condition", "positive_findings", "negative_findings", "neutral_findings", "risks"],
      properties: {
        overall_condition: { type: "string" },
        positive_findings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["finding", "data_basis"],
            properties: {
              finding: { type: "string" },
              data_basis: { type: "string" }
            }
          }
        },
        negative_findings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["finding", "data_basis"],
            properties: {
              finding: { type: "string" },
              data_basis: { type: "string" }
            }
          }
        },
        neutral_findings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["finding", "data_basis"],
            properties: {
              finding: { type: "string" },
              data_basis: { type: "string" }
            }
          }
        },
        risks: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    data_insights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["finding", "data_basis", "interpretation", "business_implication"],
        properties: {
          finding: { type: "string" },
          data_basis: { type: "string" },
          interpretation: { type: "string" },
          business_implication: { type: "string" }
        }
      }
    },
    content_strategy: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "objective", "target_audience", "recommendation", "data_basis", "priority", "expected_impact"],
        properties: {
          title: { type: "string" },
          objective: { type: "string" },
          target_audience: { type: "string" },
          recommendation: { type: "string" },
          data_basis: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          expected_impact: { type: "string" }
        }
      }
    },
    content_ideas: {
      type: "array",
      minItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "format",
          "content_pillar",
          "objective",
          "target_audience",
          "concept",
          "hook",
          "content_outline",
          "caption_angle",
          "call_to_action",
          "data_basis",
          "success_metric"
        ],
        properties: {
          title: { type: "string" },
          format: { type: "string", enum: ["Reels", "Carousel", "Single Post", "Story", "Live"] },
          content_pillar: { type: "string" },
          objective: { type: "string" },
          target_audience: { type: "string" },
          concept: { type: "string" },
          hook: { type: "string" },
          content_outline: { type: "array", items: { type: "string" } },
          caption_angle: { type: "string" },
          call_to_action: { type: "string" },
          data_basis: { type: "string" },
          success_metric: { type: "string" }
        }
      }
    },
    campaign_recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "campaign_name",
          "objective",
          "concept",
          "duration",
          "target_audience",
          "execution_steps",
          "success_metrics",
          "data_basis"
        ],
        properties: {
          campaign_name: { type: "string" },
          objective: { type: "string" },
          concept: { type: "string" },
          duration: { type: "string" },
          target_audience: { type: "string" },
          execution_steps: { type: "array", items: { type: "string" } },
          success_metrics: { type: "array", items: { type: "string" } },
          data_basis: { type: "string" }
        }
      }
    },
    engagement_strategy: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["strategy", "reason", "implementation", "success_metric"],
        properties: {
          strategy: { type: "string" },
          reason: { type: "string" },
          implementation: { type: "string" },
          success_metric: { type: "string" }
        }
      }
    },
    posting_schedule: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "time", "content_format", "content_theme", "objective", "reason"],
        properties: {
          day: { type: "string" },
          time: { type: "string" },
          content_format: { type: "string" },
          content_theme: { type: "string" },
          objective: { type: "string" },
          reason: { type: "string" }
        }
      }
    },
    growth_opportunities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["opportunity", "data_basis", "implementation"],
        properties: {
          opportunity: { type: "string" },
          data_basis: { type: "string" },
          implementation: { type: "string" }
        }
      }
    },
    priority_actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority_number", "action", "reason", "implementation", "timeframe", "success_metric"],
        properties: {
          priority_number: { type: "number" },
          action: { type: "string" },
          reason: { type: "string" },
          implementation: { type: "string" },
          timeframe: { type: "string" },
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

// Helper function to make HTTPS request using fetch
async function makeRequest(url, options, data) {
  try {
    console.log('=== Sylor API Request ===');
    console.log('Endpoint:', url);
    console.log('Method:', options.method);
    console.log('Headers:', JSON.stringify(options.headers, (key, value) => key === 'Authorization' ? '***' : value));
    console.log('Body length:', data ? JSON.stringify(data).length : 0);
    
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
    
    const body = await response.text();
    console.log('Response body length:', body.length);
    
    if (!response.ok) {
      console.log('Response body (first 1000 chars):', body.substring(0, 1000));
      
      // Check if response is HTML
      if (body.trim().startsWith('<') || body.includes('<html') || body.includes('<HTML')) {
        console.error('Sylor API returned HTML instead of JSON');
        console.error('HTML response:', body.substring(0, 500));
        throw new Error('Sylor API returned HTML error page. Check API endpoint, base URL, and API key configuration.');
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
        console.error('JSON parse error. Response body:', body.substring(0, 500));
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
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed' 
      })
    };
  }
  
  // Validate environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || 'https://api.sylorapi.com';
  
  console.log('Environment Check:');
  console.log('  hasApiKey:', !!apiKey);
  console.log('  keyLength:', apiKey ? apiKey.length : 0);
  console.log('  model:', configuredModel);
  console.log('  baseUrl:', baseUrl);
  
  if (!apiKey) {
    console.log('ERROR: OPENAI_API_KEY is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        code: 'API_KEY_MISSING',
        message: 'OPENAI_API_KEY is not configured',
        hasApiKey: false,
        keyLength: 0,
        model: configuredModel,
        baseUrl: baseUrl
      })
    };
  }
  
  if (!configuredModel) {
    console.log('ERROR: OPENAI_MODEL is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        code: 'MODEL_MISSING',
        message: 'OPENAI_MODEL is not configured',
        hasApiKey: true,
        keyLength: apiKey.length,
        model: null,
        baseUrl: baseUrl
      })
    };
  }
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Request data parsed successfully');
    } catch (e) {
      console.log('ERROR: Invalid JSON in request body', e.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false,
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body' 
        })
      };
    }
    
    // Validate input payload
    const validation = validateInputPayload(requestData);
    if (!validation.valid) {
      console.log('ERROR: Validation failed', validation.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false,
          code: 'INVALID_PAYLOAD',
          message: validation.errors[0] || 'Data analisis belum tersedia untuk menghasilkan rekomendasi.' 
        })
      };
    }
    console.log('Request validation passed');
    
    // Build input for Sylor API
    const inputPayload = JSON.stringify(requestData);
    console.log('Input payload length:', inputPayload.length);
    
    console.log('Calling Sylor API...');
    console.log('Using model:', configuredModel);
    console.log('Base URL:', baseUrl);
    
    // Try anthropic-messages format first
    let sylorResponse;
    let useAnthropicFormat = true;
    
    try {
      const sylorUrl = `${baseUrl}/v1/messages`;
      
      const requestBody = {
        model: configuredModel,
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
      
      console.log('Sylor API response received (anthropic-messages format)');
    } catch (e) {
      console.log('Anthropic-messages format failed:', e.message);
      
      // Fallback to OpenAI-style chat/completions endpoint
      if (e.message.includes('HTML') || e.message.includes('Invalid JSON')) {
        console.log('Trying OpenAI-style chat/completions endpoint as fallback...');
        useAnthropicFormat = false;
        
        const openaiUrl = `${baseUrl}/v1/chat/completions`;
        
        const requestBody = {
          model: configuredModel,
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
        
        sylorResponse = await makeRequest(openaiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }, requestBody);
        
        console.log('Sylor API response received (OpenAI-style format)');
      } else {
        throw e;
      }
    }
    
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
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false,
          code: 'EMPTY_RESPONSE',
          message: 'No text content in response' 
        })
      };
    }
    
    console.log('Output text length:', outputText.length);
    
    // Parse JSON
    let parsedResponse;
    try {
      parsedResponse = safeParseJSON(outputText);
      console.log('JSON parsed successfully');
    } catch (e) {
      console.error('JSON parsing error:', e.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false,
          code: 'INVALID_JSON',
          message: `Response is not valid JSON: ${e.message}` 
        })
      };
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: parsedResponse
      })
    };
    
  } catch (error) {
    console.error('=== Sylor AI Recommendation Error ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Model used:', configuredModel);
    
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'Failed to generate recommendation';
    
    if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
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
    }
    
    console.log('Error code:', errorCode);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        code: errorCode,
        message: errorMessage,
        details: error.message,
        model: configuredModel,
        baseUrl: baseUrl
      })
    };
  }
};
