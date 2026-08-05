// Health check endpoint for Sylor AI
exports.handler = async (event, context) => {
  console.log('=== Sylor AI Health Check Started ===');
  console.log('HTTP Method:', event.httpMethod);
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed' 
      })
    };
  }
  
  // Check environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || 'https://api.sylorapi.com';
  
  // Fallback model list
  const fallbackModels = [
    configuredModel,
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ].filter(m => m);
  
  console.log('Environment Check:');
  console.log('  hasApiKey:', !!apiKey);
  console.log('  keyLength:', apiKey ? apiKey.length : 0);
  console.log('  configuredModel:', configuredModel);
  console.log('  fallbackModels:', fallbackModels);
  console.log('  baseUrl:', baseUrl);
  
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        provider: 'Sylor AI',
        baseUrl: baseUrl,
        model: configuredModel,
        hasApiKey: false,
        reachable: false,
        error: 'OPENAI_API_KEY not configured'
      })
    };
  }
  
  if (!configuredModel) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        provider: 'Sylor AI',
        baseUrl: baseUrl,
        model: null,
        hasApiKey: true,
        reachable: false,
        error: 'OPENAI_MODEL not configured'
      })
    };
  }
  
  // Try to make a simple request to Sylor API with fallback models
  let successfulModel = null;
  let lastError = null;
  
  for (const modelToTry of fallbackModels) {
    try {
      console.log(`Trying model: ${modelToTry}`);
      
      // Try OpenAI-style endpoint first (more common)
      const openaiUrl = `${baseUrl}/v1/chat/completions`;
      
      const response = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelToTry,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Test'
            }
          ]
        })
      });
      
      console.log(`Sylor API response status for ${modelToTry}:`, response.status);
      
      if (response.ok) {
        successfulModel = modelToTry;
        console.log(`Successfully connected with model: ${modelToTry}`);
        break;
      } else {
        const errorData = await response.json();
        console.error(`Model ${modelToTry} failed:`, errorData);
        lastError = errorData.error?.message || `HTTP ${response.status}`;
        continue;
      }
    } catch (error) {
      console.error(`Model ${modelToTry} error:`, error.message);
      lastError = error.message;
      continue;
    }
  }
  
  if (successfulModel) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        provider: 'Sylor AI',
        baseUrl: baseUrl,
        configuredModel: configuredModel,
        successfulModel: successfulModel,
        hasApiKey: true,
        reachable: true
      })
    };
  } else {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        provider: 'Sylor AI',
        baseUrl: baseUrl,
        configuredModel: configuredModel,
        hasApiKey: true,
        reachable: false,
        error: lastError || 'All models failed',
        attemptedModels: fallbackModels
      })
    };
  }
};
