// Health check endpoint for Gemini API
exports.handler = async (event, context) => {
  console.log('=== Gemini Health Check Started ===');
  console.log('HTTP Method:', event.httpMethod);
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Check for API Key
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('Model:', model);
  
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: 'GEMINI_API_KEY not configured',
        model: model
      })
    };
  }
  
  // Try to make a simple request to Gemini API
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Test'
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });
    
    console.log('Gemini API response status:', response.status);
    
    if (response.ok) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'healthy',
          model: model,
          message: 'Gemini API is accessible'
        })
      };
    } else {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'unhealthy',
          error: errorData.error?.message || 'Gemini API error',
          model: model,
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
        status: 'unhealthy',
        error: error.message,
        model: model
      })
    };
  }
};
