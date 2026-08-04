// System instruction for Gemini
const SYSTEM_INSTRUCTION = `Anda adalah analis media sosial yang memberikan rekomendasi berdasarkan hasil klasifikasi sentimen. Gunakan hanya data JSON yang diberikan. Jangan membuat angka, fakta, topik, atau komentar yang tidak tersedia. Setiap rekomendasi harus menyebutkan dasar datanya. Jangan memberikan prediksi persentase peningkatan tanpa model forecasting. Jangan mengklaim hubungan sebab-akibat tanpa bukti. Gunakan bahasa Indonesia formal dan mudah dipahami. Hasilkan rekomendasi untuk tim digital marketing.`;

// Helper function to make HTTPS request using fetch (more reliable in Netlify Functions)
async function makeRequest(url, options, data) {
  try {
    console.log('Making request to:', url);
    console.log('Request options:', options);
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const body = await response.text();
    console.log('Response body length:', body.length);
    
    try {
      const parsed = JSON.parse(body);
      
      if (response.ok) {
        return parsed;
      } else {
        throw new Error(parsed.error?.message || `HTTP ${response.status}`);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('Invalid JSON response');
      }
      throw e;
    }
  } catch (error) {
    console.error('Request error:', error.message);
    console.error('Error stack:', error.stack);
    
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

// Validate Gemini response
function validateGeminiResponse(response) {
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
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(text);
    
    // Validate required fields
    const requiredFields = ['summary', 'main_findings', 'negative_issues', 'positive_drivers', 'recommendations', 'limitations'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return parsed;
  } catch (e) {
    throw new Error('Response is not valid JSON');
  }
}

// Netlify Function handler
exports.handler = async (event, context) => {
  console.log('=== Gemini Recommendation Function Started ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Event body length:', event.body ? event.body.length : 0);
  
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
    
    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
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
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    });
    
    console.log('Gemini API response received');
    
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
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return error response (never expose API key)
    let errorMessage = 'Failed to generate recommendation';
    
    if (error.message.includes('API key')) {
      errorMessage = 'Gemini API Key not configured';
    } else if (error.message.includes('quota')) {
      errorMessage = 'Gemini API quota exceeded';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid response from Gemini';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to Gemini API';
    }
    
    console.log('Returning error to frontend:', errorMessage);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};
