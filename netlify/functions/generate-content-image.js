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
  const apiKey = process.env.IMAGE_API_KEY?.trim();
  const baseUrl = (process.env.IMAGE_API_BASE_URL || 'https://api.koboillm.com').replace(/\/$/, '');
  const endpoint = (process.env.IMAGE_API_ENDPOINT || '/v1/images/generations').replace(/^\/+/, '');
  const model = process.env.IMAGE_MODEL?.trim();
  
  if (!apiKey) {
    console.log({ stage: 'api_key_missing', elapsedMs: Date.now() - startedAt });
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        code: 'IMAGE_PROVIDER_NOT_CONFIGURED',
        message: 'IMAGE_API_KEY environment variable belum dikonfigurasi.'
      })
    };
  }
  
  if (!model) {
    console.log({ stage: 'model_missing', elapsedMs: Date.now() - startedAt });
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        code: 'IMAGE_PROVIDER_NOT_CONFIGURED',
        message: 'IMAGE_MODEL environment variable belum dikonfigurasi.'
      })
    };
  }
  
  console.log('[IMAGE ENV CHECK]', {
    baseUrl: process.env.IMAGE_API_BASE_URL,
    endpoint: process.env.IMAGE_API_ENDPOINT,
    model: process.env.IMAGE_MODEL,
    hasApiKey: Boolean(process.env.IMAGE_API_KEY)
  });
  
  console.log({ stage: 'env_validated', elapsedMs: Date.now() - startedAt, model, baseUrl, endpoint });
  
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
    
    // Construct URL safely
    const url = `${baseUrl}${endpoint}`;
    console.log('[FINAL URL]', url);
    console.log({ stage: 'url_constructed', elapsedMs: Date.now() - startedAt, url });
    
    // Prepare minimal request to KoboiLLM
    const requestBody = {
      model: model,
      prompt: requestData.prompt,
      size: '1024x1536',
      quality: 'medium',
      n: 1
    };
    
    console.log('[REQUEST PAYLOAD]', {
      model: requestBody.model,
      size: requestBody.size,
      quality: requestBody.quality,
      n: requestBody.n
    });
    console.log({ stage: 'calling_provider', elapsedMs: Date.now() - startedAt });
    
    // Make request to KoboiLLM
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for image generation
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startedAt;
    console.log('[KOBOI IMAGE RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`
    });
    
    // Read raw response as text first for debugging
    const rawBody = await response.text();
    console.log('[KOBOI RAW BODY PREVIEW]', rawBody.slice(0, 1000));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('[KOBOI PARSE ERROR]', {
        error: e.message,
        rawBodyPreview: rawBody.slice(0, 500)
      });
      throw new Error(`KoboiLLM returned non-JSON response. HTTP ${response.status}`);
    }
    
    if (!response.ok) {
      const providerMessage = data?.error?.message || data?.message || rawBody || `HTTP ${response.status}`;
      console.error('[KOBOI IMAGE ERROR]', {
        status: response.status,
        providerMessage
      });
      
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'IMAGE_PROVIDER_ERROR',
          providerStatus: response.status,
          providerMessage: providerMessage
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
    console.log({
      stage: 'internal_error',
      elapsedMs: Date.now() - startedAt,
      error: error.message
    });
    
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 'TIMEOUT',
          message: 'Pembuatan gambar membutuhkan waktu terlalu lama. Silakan coba kembali.'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada layanan pembuatan gambar.'
      })
    };
  }
};
