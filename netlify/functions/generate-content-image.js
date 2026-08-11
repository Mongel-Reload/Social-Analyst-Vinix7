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
    console.log({ stage: 'url_constructed', elapsedMs: Date.now() - startedAt, url });
    
    // Prepare request to KoboiLLM
    const requestBody = {
      model: model,
      prompt: requestData.prompt,
      size: '1024x1536',
      quality: 'high',
      n: 1,
      response_format: 'b64_json'
    };
    
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
    
    console.log({
      stage: 'provider_headers_received',
      elapsedMs: Date.now() - startedAt,
      status: response.status
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log({
        stage: 'provider_error',
        elapsedMs: Date.now() - startedAt,
        status: response.status,
        error: errorText.substring(0, 500)
      });
      
      let errorMessage = 'Image provider gagal memproses permintaan.';
      let errorCode = 'PROVIDER_ERROR';
      
      if (response.status === 401) {
        errorMessage = 'Image API authentication gagal.';
        errorCode = 'AUTHENTICATION_FAILED';
      } else if (response.status === 403) {
        errorMessage = 'Image provider menolak request.';
        errorCode = 'FORBIDDEN';
      } else if (response.status === 429) {
        errorMessage = 'Batas penggunaan Image API tercapai. Silakan coba kembali.';
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else if (response.status >= 500) {
        errorMessage = 'Layanan pembuatan gambar sedang bermasalah.';
        errorCode = 'SERVICE_UNAVAILABLE';
      }
      
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: errorCode,
          message: errorMessage
        })
      };
    }
    
    const responseData = await response.json();
    console.log({
      stage: 'provider_response_received',
      elapsedMs: Date.now() - startedAt
    });
    
    // Validate response structure
    if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
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
    
    const imageData = responseData.data[0];
    
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
    
    console.log({
      stage: 'response_returned',
      elapsedMs: Date.now() - startedAt,
      imageType
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
