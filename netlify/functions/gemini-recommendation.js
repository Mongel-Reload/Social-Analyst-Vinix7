// System instruction for Gemini
const SYSTEM_INSTRUCTION = `Anda adalah analis media sosial yang memberikan rekomendasi berdasarkan hasil klasifikasi sentimen. Gunakan hanya data JSON yang diberikan. Jangan membuat angka, fakta, topik, atau komentar yang tidak tersedia. Setiap rekomendasi harus menyebutkan dasar datanya. Jangan memberikan prediksi persentase peningkatan tanpa model forecasting. Jangan mengklaim hubungan sebab-akibat tanpa bukti. Gunakan bahasa Indonesia formal dan mudah dipahami. Hasilkan rekomendasi untuk tim digital marketing.`;

// Get model name from environment variable with fallback
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Helper function to make HTTPS request using fetch (more reliable in Netlify Functions)
async function makeRequest(url, options, data) {
  try {
    console.log('=== Gemini API Request ===');
    console.log('Endpoint:', url);
    console.log('Method:', options.method);
    console.log('Headers:', JSON.stringify(options.headers));
    console.log('Body length:', data ? JSON.stringify(data).length : 0);
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('=== Gemini API Response ===');
    console.log('HTTP Status:', response.status);
    console.log('HTTP Status Text:', response.statusText);
    console.log('Response OK:', response.ok);
    
    const body = await response.text();
    console.log('Response body length:', body.length);
    
    // Log response body if error (for debugging)
    if (!response.ok) {
      console.log('Response body (first 500 chars):', body.substring(0, 500));
    }
    
    try {
      const parsed = JSON.parse(body);
      
      if (response.ok) {
        return parsed;
      } else {
        // Extract Google's error message
        const googleError = parsed.error?.message || parsed.error || `HTTP ${response.status}`;
        console.error('Google API Error:', googleError);
        throw new Error(googleError);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('Invalid JSON response');
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

// Validate request data
function validateRequest(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a valid object');
    return { valid: false, errors };
  }
  
  // Validate total_comments
  if (typeof data.total_comments !== 'number' || data.total_comments < 0) {
    errors.push('total_comments must be a non-negative number');
  }
  
  if (data.total_comments === 0) {
    errors.push('total_comments cannot be zero');
  }
  
  // Validate sentiment distribution
  if (!data.sentiment_distribution || typeof data.sentiment_distribution !== 'object') {
    errors.push('sentiment_distribution is required');
  } else {
    const { positive, neutral, negative } = data.sentiment_distribution;
    
    if (typeof positive !== 'number' || positive < 0) {
      errors.push('positive count must be a non-negative number');
    }
    if (typeof neutral !== 'number' || neutral < 0) {
      errors.push('neutral count must be a non-negative number');
    }
    if (typeof negative !== 'number' || negative < 0) {
      errors.push('negative count must be a non-negative number');
    }
    
    const totalSentiment = (positive || 0) + (neutral || 0) + (negative || 0);
    if (totalSentiment > data.total_comments) {
      errors.push('Total sentiment count cannot exceed total_comments');
    }
  }
  
  // Validate sentiment percentage
  if (!data.sentiment_percentage || typeof data.sentiment_percentage !== 'object') {
    errors.push('sentiment_percentage is required');
  } else {
    const { positive, neutral, negative } = data.sentiment_percentage;
    
    if (typeof positive !== 'number' || positive < 0 || positive > 100) {
      errors.push('positive percentage must be between 0 and 100');
    }
    if (typeof neutral !== 'number' || neutral < 0 || neutral > 100) {
      errors.push('neutral percentage must be between 0 and 100');
    }
    if (typeof negative !== 'number' || negative < 0 || negative > 100) {
      errors.push('negative percentage must be between 0 and 100');
    }
  }
  
  // Validate examples
  if (data.negative_examples && Array.isArray(data.negative_examples)) {
    if (data.negative_examples.length > 5) {
      errors.push('negative_examples cannot exceed 5 items');
    }
    data.negative_examples.forEach((ex, i) => {
      if (typeof ex.text !== 'string' || ex.text.length > 200) {
        errors.push(`negative_examples[${i}].text must be a string with max 200 characters`);
      }
    });
  }
  
  if (data.positive_examples && Array.isArray(data.positive_examples)) {
    if (data.positive_examples.length > 5) {
      errors.push('positive_examples cannot exceed 5 items');
    }
    data.positive_examples.forEach((ex, i) => {
      if (typeof ex.text !== 'string' || ex.text.length > 200) {
        errors.push(`positive_examples[${i}].text must be a string with max 200 characters`);
      }
    });
  }
  
  // Validate request size
  const bodySize = JSON.stringify(data).length;
  if (bodySize > 10000) {
    errors.push('Request body too large (max 10KB)');
  }
  
  return { valid: errors.length === 0, errors };
}

// Safe JSON parser that handles various formats
function safeParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text is empty or not a string');
  }
  
  text = text.trim();
  
  // Try direct JSON parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        throw new Error('Failed to parse JSON from markdown code block');
      }
    }
    
    // Try to find JSON between curly braces
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

// Validate Gemini response
function validateGeminiResponse(response) {
  console.log('Validating Gemini response...');
  
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format');
  }
  
  if (!response.candidates || !Array.isArray(response.candidates) || response.candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const content = response.candidates[0].content;
  if (!content || !content.parts || !Array.isArray(content.parts) || content.parts.length === 0) {
    throw new Error('No content in response');
  }
  
  const text = content.parts[0].text;
  if (!text || typeof text !== 'string') {
    throw new Error('No text in response');
  }
  
  console.log('Response text length:', text.length);
  
  // Try to parse as JSON using safe parser
  let parsed;
  try {
    parsed = safeParseJSON(text);
  } catch (e) {
    console.error('JSON parsing error:', e.message);
    throw new Error(`Response is not valid JSON: ${e.message}`);
  }
  
  console.log('JSON parsed successfully');
  
  // Validate required fields with fallback for missing fields
  const requiredFields = ['summary', 'main_findings', 'negative_issues', 'positive_drivers', 'recommendations', 'limitations'];
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!parsed[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    console.warn('Missing fields in response:', missingFields);
    // Add empty arrays/strings for missing fields
    if (!parsed.summary) parsed.summary = 'Ringkasan tidak tersedia';
    if (!parsed.main_findings) parsed.main_findings = [];
    if (!parsed.negative_issues) parsed.negative_issues = [];
    if (!parsed.positive_drivers) parsed.positive_drivers = [];
    if (!parsed.recommendations) parsed.recommendations = [];
    if (!parsed.limitations) parsed.limitations = [];
  }
  
  // Ensure arrays are actually arrays
  if (!Array.isArray(parsed.main_findings)) parsed.main_findings = [];
  if (!Array.isArray(parsed.negative_issues)) parsed.negative_issues = [];
  if (!Array.isArray(parsed.positive_drivers)) parsed.positive_drivers = [];
  if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];
  if (!Array.isArray(parsed.limitations)) parsed.limitations = [];
  
  console.log('Response validation completed');
  return parsed;
}

// Netlify Function handler
exports.handler = async (event, context) => {
  console.log('=== Gemini Recommendation Function Started ===');
  console.log('Function: gemini-recommendation');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Event body length:', event.body ? event.body.length : 0);
  
  // Log environment variables (without sensitive values)
  console.log('Environment Check:');
  console.log('  GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
  console.log('  GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
  console.log('  GEMINI_MODEL from env:', process.env.GEMINI_MODEL);
  console.log('  GEMINI_MODEL final:', GEMINI_MODEL);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('ERROR: Method not allowed');
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Check for API Key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.log('ERROR: Gemini API Key not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Gemini API Key not configured' })
    };
  }
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Request data parsed successfully');
      console.log('Total comments:', requestData.total_comments);
    } catch (e) {
      console.log('ERROR: Invalid JSON in request body', e.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    // Validate request
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      console.log('ERROR: Validation failed', validation.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Validation failed', details: validation.errors })
      };
    }
    console.log('Request validation passed');
    
    // Create prompt for Gemini
    const prompt = `Berdasarkan data analisis sentimen berikut, berikan rekomendasi yang spesifik dan actionable:

DATA STATISTIK:
- Total Komentar: ${requestData.total_comments}
- Distribusi Sentimen: Positif ${requestData.sentiment_distribution.positive}, Netral ${requestData.sentiment_distribution.neutral}, Negatif ${requestData.sentiment_distribution.negative}
- Persentase Sentimen: Positif ${requestData.sentiment_percentage.positive}%, Netral ${requestData.sentiment_percentage.neutral}%, Negatif ${requestData.sentiment_percentage.negative}%
- Rata-rata Confidence: ${requestData.average_confidence || 'N/A'}
- Jumlah Low Confidence: ${requestData.low_confidence_count || 0}

TOP KATA POSITIF:
${requestData.top_positive_words ? requestData.top_positive_words.map(w => `- ${w.word} (${w.count}x)`).join('\n') : 'Tidak ada data'}

TOP KATA NEGATIF:
${requestData.top_negative_words ? requestData.top_negative_words.map(w => `- ${w.word} (${w.count}x)`).join('\n') : 'Tidak ada data'}

TOPIK DOMINAN:
${requestData.dominant_topics ? requestData.dominant_topics.map(t => `- ${t.topic} (${t.count}x)`).join('\n') : 'Tidak ada data'}

CONTOH KOMENTAR NEGATIF:
${requestData.negative_examples ? requestData.negative_examples.map(e => `- "${e.text}" (confidence: ${e.confidence})`).join('\n') : 'Tidak ada data'}

CONTOH KOMENTAR POSITIF:
${requestData.positive_examples ? requestData.positive_examples.map(e => `- "${e.text}" (confidence: ${e.confidence})`).join('\n') : 'Tidak ada data'}

INFORMASI MODEL:
- Algoritma: ${requestData.model_info?.algorithm || 'N/A'}
- Feature Extraction: ${requestData.model_info?.feature_extraction || 'N/A'}
- Versi: ${requestData.model_info?.model_version || 'N/A'}

TUGAS:
Berdasarkan data di atas, berikan rekomendasi dalam format JSON berikut:
{
  "summary": "Ringkasan kondisi sentimen akun secara keseluruhan (2-3 kalimat)",
  "dominant_sentiment": "positif/netral/negatif",
  "main_findings": [
    {
      "finding": "Temuan utama",
      "evidence": "Dasar data dari temuan tersebut"
    }
  ],
  "negative_issues": [
    {
      "issue": "Masalah utama dari sentimen negatif",
      "evidence": "Dasar data dari masalah tersebut",
      "priority": "tinggi/sedang/rendah"
    }
  ],
  "positive_drivers": [
    {
      "factor": "Faktor utama penyebab sentimen positif",
      "evidence": "Dasar data dari faktor tersebut"
    }
  ],
  "recommendations": [
    {
      "title": "Judul rekomendasi",
      "description": "Deskripsi rekomendasi",
      "evidence": "Dasar data dari rekomendasi",
      "priority": "tinggi/sedang/rendah",
      "category": "strategi konten/pelayanan/respon admin/informasi/evaluasi data"
    }
  ],
  "limitations": [
    "Keterbatasan analisis"
  ]
}

Pastikan:
- Gunakan hanya data yang diberikan
- Setiap rekomendasi menyebutkan dasar datanya
- Jangan membuat angka atau fakta baru
- Jangan memberikan prediksi persentase tanpa model forecasting
- Gunakan bahasa Indonesia formal`;

    console.log('Calling Gemini API...');
    console.log('Using model:', GEMINI_MODEL);
    
    // Call Gemini API with dynamic model
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const geminiResponse = await makeRequest(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json'
      }
    });
    
    console.log('Gemini API response received');
    console.log('Response body:', JSON.stringify(geminiResponse).substring(0, 500));
    
    // Validate and parse response
    const validatedResponse = validateGeminiResponse(geminiResponse);
    console.log('Response validated successfully');
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedResponse)
    };
    
  } catch (error) {
    console.error('=== Gemini Recommendation Error ===');
    console.error('Function: gemini-recommendation');
    console.error('Stage: API call or response processing');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Model used:', GEMINI_MODEL);
    
    // Return error response (never expose API key)
    let errorMessage = 'Failed to generate recommendation';
    let errorDetails = error.message;
    let errorType = 'unknown';
    
    if (error.message.includes('API key') || error.message.includes('API_KEY') || error.message.includes('API_KEY not configured')) {
      errorMessage = 'Gemini API Key not configured';
      errorDetails = 'API Key tidak ditemukan di environment variables Netlify';
      errorType = 'api_key_missing';
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      errorMessage = 'Gemini API quota exceeded';
      errorDetails = 'Kuota Gemini API telah mencapai batas harian';
      errorType = 'quota_exceeded';
    } else if (error.message.includes('timeout') || error.name === 'AbortError') {
      errorMessage = 'Request timeout';
      errorDetails = 'Request ke Gemini API timeout (30 detik)';
      errorType = 'timeout';
    } else if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('Invalid JSON')) {
      errorMessage = 'Gemini returned invalid JSON';
      errorDetails = 'Response dari Gemini bukan format JSON yang valid';
      errorType = 'invalid_json';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      errorMessage = 'Network error';
      errorDetails = 'Gagal melakukan request ke Gemini API';
      errorType = 'network_error';
    } else if (error.message.includes('model') || error.message.includes('404') || error.message.includes('not found') || error.message.includes('not supported')) {
      errorMessage = 'Gemini model not found';
      errorDetails = `Model ${GEMINI_MODEL} tidak tersedia atau tidak valid untuk generateContent`;
      errorType = 'model_not_found';
    } else if (error.message.includes('403') || error.message.includes('401') || error.message.includes('authentication') || error.message.includes('invalid API key')) {
      errorMessage = 'API key invalid';
      errorDetails = 'API Key tidak valid atau tidak memiliki akses';
      errorType = 'auth_failed';
    } else if (error.message.includes('Validation failed')) {
      errorMessage = 'Invalid payload';
      errorDetails = 'Data analisis tidak valid';
      errorType = 'invalid_payload';
    }
    
    console.log('Error type:', errorType);
    console.log('Returning error to frontend:', errorMessage);
    console.log('Error details:', errorDetails);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        type: errorType,
        model: GEMINI_MODEL
      })
    };
  }
};
