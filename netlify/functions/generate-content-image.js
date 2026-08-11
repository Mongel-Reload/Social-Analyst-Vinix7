// Netlify Function for AI Image Generation using KoboiLLM
// Provider: KoboiLLM (OpenAI-compatible Images API)
// Documentation: https://docs.koboillm.com/images

exports.handler = async (event, context) => {
  const startedAt = Date.now();
  console.log({ stage: 'function_started', elapsedMs: 0 });
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      })
    };
  }
  
  // Validate environment variables
  const requiredEnv = ['IMAGE_API_BASE_URL', 'IMAGE_API_ENDPOINT', 'IMAGE_MODEL', 'IMAGE_API_KEY'];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  
  if (missingEnv.length > 0) {
    console.log('[IMAGE CONFIG ERROR] Missing ENV:', missingEnv);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'IMAGE_PROVIDER_NOT_CONFIGURED',
        missingEnv
      })
    };
  }
  
  const apiKey = process.env.IMAGE_API_KEY?.trim();
  const baseUrl = (process.env.IMAGE_API_BASE_URL || '').replace(/\/+$/, '');
  const endpoint = '/' + (process.env.IMAGE_API_ENDPOINT || '').replace(/^\/+/, '');
  const model = process.env.IMAGE_MODEL?.trim();
  
  const finalUrl = `${baseUrl}${endpoint}`;
  
  console.log('[IMAGE API CONFIG]', {
    baseUrl: process.env.IMAGE_API_BASE_URL,
    endpoint: process.env.IMAGE_API_ENDPOINT,
    finalUrl,
    model,
    hasApiKey: Boolean(apiKey)
  });
  
  // Test connectivity to KoboiLLM before image request
  const connectivityStarted = Date.now();
  try {
    const testResponse = await fetch('https://lite.koboillm.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    const testBody = await testResponse.text();
    console.log('[KOBOI CONNECTIVITY]', {
      status: testResponse.status,
      duration: Date.now() - connectivityStarted,
      preview: testBody.slice(0, 500)
    });
  } catch (error) {
    console.error('[KOBOI CONNECTIVITY FAILED]', {
      message: error?.message,
      causeCode: error?.cause?.code,
      causeMessage: error?.cause?.message
    });
  }
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log({ stage: 'request_parsed', elapsedMs: Date.now() - startedAt });
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        })
      };
    }
    
    // Validate required fields
    if (!requestData.prompt || typeof requestData.prompt !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 'INVALID_PAYLOAD',
          message: 'Prompt is required'
        })
      };
    }
    
    // Prepare minimal request to KoboiLLM
    const payload = {
      model: model,
      prompt: requestData.prompt,
      size: '1024x1536',
      n: 1
    };
    
    console.log('[REQUEST PAYLOAD]', {
      model: payload.model,
      size: payload.size,
      n: payload.n
    });
    
    // Make request to KoboiLLM (no timeout for debugging)
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const duration = Date.now() - startedAt;
    console.log('[IMAGE DURATION]', `${duration}ms`);
    console.log('[KOBOI RESPONSE]', {
      status: response.status,
      statusText: response.statusText
    });
    
    // Read raw response as text first for debugging
    const rawBody = await response.text();
    console.log('[KOBOI RAW BODY PREVIEW]', rawBody.slice(0, 1500));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('[KOBOI PARSE ERROR]', {
        error: e.message,
        rawBodyPreview: rawBody.slice(0, 500)
      });
      
      return {
        statusCode: response.status || 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            type: 'IMAGE_PROVIDER_NON_JSON',
            message: `Provider returned non-JSON response: ${rawBody.slice(0, 500)}`,
            providerStatus: response.status
          }
        })
      };
    }
    
    if (!response.ok) {
      console.error('[KOBOI PROVIDER ERROR]', {
        status: response.status,
        statusText: response.statusText,
        rawBody: rawBody.slice(0, 500)
      });
      
      return {
        statusCode: response.status || 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            type: 'IMAGE_PROVIDER_ERROR',
            message: data?.error?.message || data?.message || rawBody || `HTTP ${response.status}`,
            providerStatus: response.status
          }
        })
      };
    }
    
    console.log('[KOBOI IMAGE SUCCESS]', {
      keys: Object.keys(data || {}),
      dataLength: Array.isArray(data?.data) ? data.data.length : null,
      firstItemKeys: data?.data?.[0] ? Object.keys(data.data[0]) : []
    });
    
    // Validate response structure
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 'INVALID_RESPONSE',
          message: 'Image API menghasilkan response yang tidak valid.'
        })
      };
    }
    
    const imageData = data.data[0];
    
    // Support both b64_json and url
    let imageType, imageValue;
    
    if (imageData.b64_json) {
      imageType = 'base64';
      imageValue = imageData.b64_json;
    } else if (imageData.url) {
      imageType = 'url';
      imageValue = imageData.url;
    } else {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 'INVALID_RESPONSE',
          message: 'Image API tidak mengembalikan data gambar yang valid.'
        })
      };
    }
    
    console.log('[FINAL IMAGE DATA]', {
      imageType,
      hasValue: Boolean(imageValue)
    });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        image: {
          type: imageType,
          value: imageValue
        }
      })
    };
    
  } catch (error) {
    console.error('[IMAGE FETCH ERROR]', {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
      causeName: error?.cause?.name,
      causeCode: error?.cause?.code,
      causeMessage: error?.cause?.message,
      stack: error?.stack
    });
    
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            type: 'IMAGE_FETCH_FAILED',
            message: 'Request timeout - image generation took too long',
            causeCode: 'TIMEOUT'
          }
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          type: 'IMAGE_FETCH_FAILED',
          message: error?.message || 'fetch failed',
          causeCode: error?.cause?.code || null,
          causeMessage: error?.cause?.message || null
        }
      })
    };
  }
};
