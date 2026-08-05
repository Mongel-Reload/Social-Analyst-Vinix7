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
  
  console.log('Environment Check:');
  console.log('  hasApiKey:', !!apiKey);
  console.log('  keyLength:', apiKey ? apiKey.length : 0);
  console.log('  model:', configuredModel);
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
  
  // Try to make a simple request to Sylor API
  try {
    const sylorUrl = `${baseUrl}/v1/messages`;
    
    const response = await fetch(sylorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: configuredModel,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ]
      })
    });
    
    console.log('Sylor API response status:', response.status);
    
    if (response.ok) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          provider: 'Sylor AI',
          baseUrl: baseUrl,
          model: configuredModel,
          hasApiKey: true,
          reachable: true
        })
      };
    } else {
      const errorData = await response.json();
      console.error('Sylor API error:', errorData);
      
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
          hasApiKey: true,
          reachable: false,
          error: errorData.error?.message || 'Sylor API error',
          statusCode: response.status
        })
      };
    }
  } catch (error) {
    console.error('Health check error:', error.message);
    
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
        hasApiKey: true,
        reachable: false,
        error: error.message
      })
    };
  }
};
