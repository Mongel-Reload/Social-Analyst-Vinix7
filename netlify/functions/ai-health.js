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

// Helper function to make HTTPS request using fetch (with latency measurement)
async function makeRequest(url, options, data) {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for health check
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const body = await response.text();
    const latencyMs = Date.now() - startedAt;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Non-JSON response: ${contentType}`);
    }
    
    try {
      const parsed = JSON.parse(body);
      return { data: parsed, latencyMs };
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

// Netlify Function handler for AI health check (minimal prompt)
exports.handler = async (event, context) => {
  const startedAt = Date.now();
  console.log({ stage: 'health_check_started', elapsedMs: 0 });
  
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
  
  if (!configuredModel) {
    return jsonResponse(503, {
      success: false,
      code: 'MODEL_MISSING',
      message: 'OPENAI_MODEL environment variable belum dikonfigurasi.',
      provider: 'Sylor'
    });
  }
  
  const healthStatus = {
    success: true,
    provider: 'Sylor',
    model: configuredModel,
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    baseUrl: baseUrl,
    providerReachable: false,
    contentType: null,
    latencyMs: 0,
    timestamp: new Date().toISOString()
  };
  
  // Check API key
  if (!apiKey) {
    healthStatus.success = false;
    healthStatus.code = 'API_KEY_MISSING';
    healthStatus.message = 'OPENAI_API_KEY is not configured';
    return jsonResponse(503, healthStatus);
  }
  
  console.log({ stage: 'env_validated', elapsedMs: Date.now() - startedAt, model: configuredModel });
  
  // Test provider connectivity with minimal prompt
  try {
    console.log({ stage: 'testing_provider', elapsedMs: Date.now() - startedAt });
    
    // Gunakan endpoint anthropic-messages
    const testUrl = `${baseUrl}/v1/messages`;
    
    const requestBody = {
      model: configuredModel,
      max_tokens: 30, // Minimal output
      system: 'You are a helpful assistant. Respond with only JSON.',
      messages: [
        {
          role: 'user',
          content: 'Respond with JSON: {"ok":true}'
        }
      ]
    };
    
    const { data, latencyMs } = await makeRequest(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01'
      }
    }, requestBody);
    
    healthStatus.providerReachable = true;
    healthStatus.contentType = 'application/json';
    healthStatus.latencyMs = latencyMs;
    
    // Check if latency is too high
    if (latencyMs > 15000) {
      healthStatus.success = false;
      healthStatus.code = 'PROVIDER_SLOW';
      healthStatus.message = 'Provider response time too high';
    }
    
    console.log({ stage: 'health_check_complete', elapsedMs: Date.now() - startedAt, latencyMs });
    
  } catch (error) {
    console.log({ stage: 'health_check_failed', elapsedMs: Date.now() - startedAt, error: error.message });
    healthStatus.providerReachable = false;
    
    // Determine error code
    if (error.message.includes('timeout')) {
      healthStatus.code = 'TIMEOUT';
      healthStatus.message = 'Request to provider timed out';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      healthStatus.code = 'AUTH_FAILED';
      healthStatus.message = 'API key authentication failed';
    } else if (error.message.includes('404')) {
      healthStatus.code = 'ENDPOINT_NOT_FOUND';
      healthStatus.message = 'API endpoint not found';
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      healthStatus.code = 'NETWORK_ERROR';
      healthStatus.message = 'Failed to reach provider';
    } else if (error.message.includes('Non-JSON')) {
      healthStatus.code = 'PROVIDER_NON_JSON';
      healthStatus.message = 'Provider returned non-JSON response';
    } else {
      healthStatus.code = 'PROVIDER_ERROR';
      healthStatus.message = error.message;
    }
    
    healthStatus.success = false;
  }
  
  return jsonResponse(healthStatus.success ? 200 : 503, healthStatus);
};
