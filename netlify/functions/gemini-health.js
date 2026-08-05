// Health check endpoint for OpenAI API
exports.handler = async (event, context) => {
  console.log('=== OpenAI Health Check Started ===');
  console.log('HTTP Method:', event.httpMethod);
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Check for API Key
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.2';
  
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
        error: 'OPENAI_API_KEY not configured',
        model: model
      })
    };
  }
  
  // Try to make a simple request to OpenAI API
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ],
        max_tokens: 10
      })
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (response.ok) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'healthy',
          model: model,
          message: 'OpenAI API is accessible'
        })
      };
    } else {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'unhealthy',
          error: errorData.error?.message || 'OpenAI API error',
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
