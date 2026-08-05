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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const body = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }
    
    try {
      return JSON.parse(body);
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

// Netlify Function handler for AI health check
exports.handler = async (event, context) => {
  console.log('=== AI Health Check Started ===');
  console.log('Function: ai-health');
  console.log('HTTP Method:', event.httpMethod);
  
  // Allow both GET and POST
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
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
  
  const healthStatus = {
    success: true,
    provider: 'Sylor',
    model: configuredModel,
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    baseUrlValid: !!baseUrl,
    baseUrl: baseUrl,
    modelAllowed: configuredModel ? allowedModels.includes(configuredModel) : false,
    allowedModels: allowedModels,
    providerReachable: false,
    contentType: null,
    testRequest: null,
    timestamp: new Date().toISOString()
  };
  
  // Check API key
  if (!apiKey) {
    healthStatus.success = false;
    healthStatus.code = 'API_KEY_MISSING';
    healthStatus.message = 'OPENAI_API_KEY is not configured';
    return jsonResponse(503, healthStatus);
  }
  
  // Check model
  if (!configuredModel) {
    healthStatus.success = false;
    healthStatus.code = 'MODEL_MISSING';
    healthStatus.message = 'OPENAI_MODEL is not configured';
    return jsonResponse(503, healthStatus);
  }
  
  // Check model is allowed
  if (!allowedModels.includes(configuredModel)) {
    healthStatus.success = false;
    healthStatus.code = 'MODEL_NOT_ALLOWED';
    healthStatus.message = `Model ${configuredModel} is not in the allowed list`;
    return jsonResponse(503, healthStatus);
  }
  
  // Test provider connectivity with a minimal request
  try {
    console.log('Testing provider connectivity...');
    console.log('Base URL:', baseUrl);
    console.log('Model:', configuredModel);
    
    const testUrl = `${baseUrl}/v1/chat/completions`;
    
    const requestBody = {
      model: configuredModel,
      max_tokens: 10,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Say "OK"'
        }
      ]
    };
    
    const response = await makeRequest(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }, requestBody);
    
    healthStatus.providerReachable = true;
    healthStatus.contentType = 'application/json';
    healthStatus.testRequest = {
      status: 'success',
      model: configuredModel,
      responsePreview: JSON.stringify(response).substring(0, 200)
    };
    
    console.log('Provider connectivity test passed');
    
  } catch (error) {
    console.error('Provider connectivity test failed:', error.message);
    healthStatus.providerReachable = false;
    healthStatus.testRequest = {
      status: 'failed',
      error: error.message
    };
    
    // Determine error code
    if (error.message.includes('HTML') || error.message.includes('Sylor API returned HTML')) {
      healthStatus.code = 'PROVIDER_HTML_RESPONSE';
      healthStatus.message = 'Provider returned HTML instead of JSON';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      healthStatus.code = 'AUTH_FAILED';
      healthStatus.message = 'API key authentication failed';
    } else if (error.message.includes('404')) {
      healthStatus.code = 'ENDPOINT_NOT_FOUND';
      healthStatus.message = 'API endpoint not found';
    } else if (error.message.includes('timeout')) {
      healthStatus.code = 'TIMEOUT';
      healthStatus.message = 'Request to provider timed out';
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      healthStatus.code = 'NETWORK_ERROR';
      healthStatus.message = 'Failed to reach provider';
    } else {
      healthStatus.code = 'PROVIDER_ERROR';
      healthStatus.message = error.message;
    }
    
    healthStatus.success = false;
  }
  
  return jsonResponse(healthStatus.success ? 200 : 503, healthStatus);
};
