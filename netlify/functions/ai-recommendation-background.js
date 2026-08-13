// Netlify Background Function for AI Recommendation using Sylor API
// This function runs asynchronously and can take up to 15 minutes
// Provider: Sylor API (OpenAI-compatible)

// Legacy Netlify Functions background configuration
exports.config = {
  background: true
};

// System instruction for Sylor AI (ringkas)
const SYSTEM_INSTRUCTION = `Anda adalah Social Media Strategist untuk VINIX7.

Gunakan hasil klasifikasi sentimen TF-IDF dan Multinomial Naive Bayes yang diberikan.

Jangan mengulang seluruh angka analisis.
Hasilkan rekomendasi singkat dan praktis berdasarkan data.

Kembalikan hanya JSON valid tanpa Markdown.

Struktur wajib:
{
  "executive_summary": "",
  "key_insights": [],
  "positive_factors": [],
  "negative_issues": [],
  "content_ideas": [],
  "priority_actions": [],
  "strategic_recommendations": [],
  "limitations": []
}

Ketentuan:
- executive_summary maksimal 80 kata;
- key_insights tepat 3 (insight, data_basis);
- positive_factors tepat 3 (factor, data_basis);
- negative_issues tepat 3 (issue, data_basis);
- content_ideas tepat 3 (title, format, concept, call_to_action, data_basis);
- priority_actions tepat 3 (action, reason, success_metric);
- strategic_recommendations tepat 3 (recommendation, rationale, expected_impact);
- limitations tepat 2 (limitation, mitigation);
- setiap rekomendasi harus memiliki data_basis;
- jangan mengarang data yang tidak tersedia.

PENTING - JANGAN GUNAKAN TEKS PLACEHOLDER:
- JANGAN gunakan frasa "belum tersedia", "not available", "tidak tersedia", atau sejenisnya
- JANGAN gunakan frasa "informasi ... belum tersedia"
- Jika informasi spesifik tidak ada di data, gunakan wording umum yang informatif
- Contoh: daripada "Minimal semester belum tersedia" → "Ketentuan semester dapat menyesuaikan posisi yang tersedia"
- Contoh: daripada "Cara daftar belum tersedia" → "Ikuti informasi pendaftaran melalui kanal resmi VINIX7"

BRANDING:
- Gunakan nama brand VINIX7 dalam konten
- JANGAN gunakan "KokoroLens" sebagai nama brand dalam rekomendasi konten

FAKTUAL GROUNDING:
- JANGAN mengarang fakta perusahaan (semester minimum, jurusan, benefit, dll)
- Hanya gunakan informasi yang ada dalam data analisis
- Jika data tidak cukup, gunakan fewer content ideas (bukan mengarang fakta)
- Gunakan insight dari komentar sebagai dasar topik konten
- JANGAN mengubah pertanyaan atau asumsi dari komentar menjadi fakta resmi perusahaan
- Jika informasi persyaratan tidak tersedia pada dataset atau profil brand, gunakan kalimat aman seperti "cek persyaratan pada lowongan yang tersedia" atau "ikuti informasi resmi VINIX7"`;

exports.handler = async (event, context) => {
  console.log('[AI RECOMMENDATION HANDLER ENTERED]', {
    timestamp: new Date().toISOString()
  });
  
  const startedAt = Date.now();
  console.log('[AI RECOMMENDATION JOB] started');
  
  // Parse job data from event
  let jobData;
  try {
    jobData = JSON.parse(event.body || '{}');
    console.log('[AI RECOMMENDATION JOB START]', {
      jobId: jobData.jobId
    });
  } catch (e) {
    console.error('[AI RECOMMENDATION JOB] Invalid job data');
    return { statusCode: 400, body: 'Invalid job data' };
  }
  
  const { jobId, requestData } = jobData;
  
  if (!jobId) {
    console.error('[AI RECOMMENDATION JOB] Missing jobId');
    return { statusCode: 400, body: 'Missing jobId' };
  }
  
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing', null);
    console.log('[AI RECOMMENDATION JOB] status: processing');
    
    // Validate environment variables
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const configuredModel = process.env.OPENAI_MODEL?.trim();
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.sylorapi.com/v1').replace(/\/+$/, '');
    const chatEndpoint = (process.env.OPENAI_CHAT_ENDPOINT || '/chat/completions').replace(/^\/+/, '');
    
    if (!configuredModel || !apiKey) {
      console.error('[AI RECOMMENDATION JOB] Missing ENV configuration');
      await updateJobStatus(jobId, 'failed', { type: 'CONFIG_ERROR', message: 'Missing API configuration' });
      return { statusCode: 500, body: 'Missing configuration' };
    }
    
    console.log('[AI RECOMMENDATION JOB] ENV validated', { model: configuredModel, baseUrl, chatEndpoint });
    
    // Validate and lighten payload
    const validation = validateInputPayload(requestData);
    if (!validation.valid) {
      console.error('[AI RECOMMENDATION JOB] Payload validation failed', validation.errors);
      await updateJobStatus(jobId, 'failed', { type: 'INVALID_PAYLOAD', message: validation.errors[0] || 'Invalid payload' });
      return { statusCode: 400, body: 'Invalid payload' };
    }
    
    const inputPayload = JSON.stringify(requestData);
    const payloadBytes = inputPayload.length;
    console.log('[AI RECOMMENDATION JOB] Payload validated', { payloadBytes });
    
    if (payloadBytes > 15000) {
      console.error('[AI RECOMMENDATION JOB] Payload too large', { payloadBytes });
      await updateJobStatus(jobId, 'failed', { type: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 15KB limit' });
      return { statusCode: 400, body: 'Payload too large' };
    }
    
    // Call Sylor API
    const sylorUrl = `${baseUrl}/${chatEndpoint}`;
    const requestBody = {
      model: configuredModel,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: SYSTEM_INSTRUCTION
        },
        {
          role: 'user',
          content: `Berdasarkan data analisis media sosial berikut, berikan rekomendasi yang spesifik dan actionable dalam format JSON sesuai schema:\n\n${inputPayload}`
        }
      ]
    };
    
    console.log('[AI RECOMMENDATION JOB] Calling Sylor API', { url: sylorUrl });
    
    let sylorResponse;
    try {
      sylorResponse = await makeRequest(sylorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }, requestBody, startedAt);
    } catch (error) {
      console.error('[AI RECOMMENDATION JOB] Sylor API request failed', {
        error: error.message,
        httpStatus: error.httpStatus
      });
      
      const errorType = error.httpStatus === 504 ? 'TIMEOUT' : 
                       error.httpStatus === 503 ? 'NETWORK_ERROR' : 
                       'PROVIDER_ERROR';
      
      await updateJobStatus(jobId, 'failed', { 
        type: errorType, 
        message: error.message || 'Provider API failed' 
      });
      return { statusCode: error.httpStatus || 500, body: error.message };
    }
    
    // Parse response
    let outputText;
    if (sylorResponse.choices && Array.isArray(sylorResponse.choices) && sylorResponse.choices.length > 0) {
      const choice = sylorResponse.choices[0];
      if (choice.message && choice.message.content) {
        outputText = choice.message.content;
      }
    }
    
    if (!outputText) {
      console.error('[AI RECOMMENDATION JOB] Empty response from Sylor');
      await updateJobStatus(jobId, 'failed', { type: 'EMPTY_RESPONSE', message: 'Empty response from provider' });
      return { statusCode: 500, body: 'Empty response' };
    }
    
    // Parse JSON
    let parsedResponse;
    try {
      parsedResponse = safeParseJSON(outputText);
      console.log('[AI RECOMMENDATION JOB] Response parsed successfully');
    } catch (e) {
      console.error('[AI RECOMMENDATION JOB] JSON parse failed', { error: e.message });
      await updateJobStatus(jobId, 'failed', { type: 'INVALID_JSON', message: `Invalid JSON: ${e.message}` });
      return { statusCode: 500, body: 'Invalid JSON response' };
    }
    
    // Validate output fields (not just array length)
    const validationError = validateAIOutput(parsedResponse);
    if (validationError) {
      console.error('[AI RECOMMENDATION JOB] Output validation failed', validationError);
      await updateJobStatus(jobId, 'failed', { type: 'AI_INVALID_OUTPUT', message: validationError });
      return { statusCode: 500, body: 'Invalid AI output structure' };
    }
    
    console.log('[AI RECOMMENDATION JOB] Output validated successfully');
    
    await updateJobStatusWithResult(jobId, 'completed', null, parsedResponse);
    
    console.log('[AI RECOMMENDATION JOB] completed successfully');
    return { statusCode: 200, body: 'Job completed' };
    
  } catch (error) {
    console.error('[AI RECOMMENDATION JOB] Error', {
      name: error?.name,
      message: error?.message,
      causeCode: error?.cause?.code,
      causeMessage: error?.cause?.message
    });
    
    await updateJobStatus(jobId, 'failed', {
      type: 'INTERNAL_ERROR',
      message: error.message
    });
    
    return { statusCode: 500, body: 'Internal error' };
  }
};

// Helper: Update job status in Netlify Blobs
async function updateJobStatus(jobId, status, error = null) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-ai-recommendation-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[AI JOB UPDATE]', {
      store: 'kokorolens-ai-recommendation-jobs',
      jobId,
      key: jobId,
      status
    });
    
    const jobData = {
      id: jobId,
      status,
      updatedAt: new Date().toISOString(),
      ...(error && { error })
    };
    
    await store.setJSON(jobId, jobData);
    console.log('[AI RECOMMENDATION JOB] Status updated', { jobId, status });
    
    // Verify update
    const verification = await store.get(jobId, { type: 'json' });
    console.log('[AI JOB UPDATE VERIFY]', {
      jobId,
      found: Boolean(verification),
      status: verification?.status || null,
      updatedAt: verification?.updatedAt || null
    });
  } catch (e) {
    console.error('[AI RECOMMENDATION JOB] Failed to update status', e.message);
  }
}

// Helper: Update job status with result
async function updateJobStatusWithResult(jobId, status, error = null, result = null) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-ai-recommendation-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[AI JOB UPDATE]', {
      store: 'kokorolens-ai-recommendation-jobs',
      jobId,
      key: jobId,
      status
    });
    
    const jobData = {
      id: jobId,
      status,
      updatedAt: new Date().toISOString(),
      ...(error && { error }),
      ...(result && { result })
    };
    
    await store.setJSON(jobId, jobData);
    console.log('[AI RECOMMENDATION JOB] Status updated with result', { jobId, status });
    
    // Verify update
    const verification = await store.get(jobId, { type: 'json' });
    console.log('[AI JOB UPDATE VERIFY]', {
      jobId,
      found: Boolean(verification),
      status: verification?.status || null,
      hasResult: Boolean(verification?.result),
      updatedAt: verification?.updatedAt || null
    });
  } catch (e) {
    console.error('[AI RECOMMENDATION JOB] Failed to update status with result', e.message);
  }
}

// Helper function to make HTTPS request using fetch
async function makeRequest(url, options, data, startedAt) {
  try {
    console.log({
      stage: 'provider_request_started',
      elapsedMs: Date.now() - startedAt,
      url,
      payloadBytes: data ? JSON.stringify(data).length : 0
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log({
      stage: 'provider_headers_received',
      elapsedMs: Date.now() - startedAt,
      status: response.status,
      contentType: response.headers.get('content-type')
    });
    
    const body = await response.text();
    
    console.log({
      stage: 'provider_body_received',
      elapsedMs: Date.now() - startedAt,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 500)
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
      error.httpStatus = response.status;
      error.responseBody = body;
      throw error;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const error = new Error(`Non-JSON response: ${contentType}`);
      error.httpStatus = response.status;
      error.responseBody = body;
      throw error;
    }
    
    try {
      const parsed = JSON.parse(body);
      console.log({
        stage: 'provider_json_parsed',
        elapsedMs: Date.now() - startedAt
      });
      return parsed;
    } catch (e) {
      const error = new Error('Invalid JSON response');
      error.httpStatus = response.status;
      error.responseBody = body;
      throw error;
    }
  } catch (error) {
    console.log({
      stage: 'request_error',
      elapsedMs: Date.now() - startedAt,
      error: error.message,
      errorName: error.name
    });
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.httpStatus = 504;
      throw timeoutError;
    }
    
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('ENOTFOUND') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('getaddrinfo') ||
        error.message.includes('fetch failed')) {
      const networkError = new Error(`Network error: ${error.message}`);
      networkError.httpStatus = 503;
      networkError.responseBody = error.message;
      throw networkError;
    }
    
    throw error;
  }
}

// Safe JSON parser
function safeParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text is empty or not a string');
  }
  
  text = text.trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        throw new Error('Failed to parse JSON from markdown code block');
      }
    }
    
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

// Validate input payload
function validateInputPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] };
  }
  
  const errors = [];
  
  if (!data.sentiment_summary && !data.linguistic_summary && !data.representative_comments) {
    return {
      valid: false,
      errors: ['Data analisis belum tersedia untuk menghasilkan rekomendasi.']
    };
  }
  
  // Limit representative comments to 3 per class, 250 chars
  if (data.representative_comments) {
    const comments = data.representative_comments;
    
    if (comments.positive && comments.positive.length > 3) {
      comments.positive = comments.positive.slice(0, 3);
    }
    if (comments.neutral && comments.neutral.length > 3) {
      comments.neutral = comments.neutral.slice(0, 3);
    }
    if (comments.negative && comments.negative.length > 3) {
      comments.negative = comments.negative.slice(0, 3);
    }
    
    if (comments.positive) {
      comments.positive = comments.positive.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    if (comments.neutral) {
      comments.neutral = comments.neutral.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    if (comments.negative) {
      comments.negative = comments.negative.map(c => ({ ...c, text: c.text ? c.text.substring(0, 250) : '' }));
    }
    
    console.log('Limited comments to 3 per class, 250 chars each');
  }
  
  // Limit frequent terms to 5 per class
  if (data.frequent_terms) {
    if (data.frequent_terms.positive && data.frequent_terms.positive.length > 5) {
      data.frequent_terms.positive = data.frequent_terms.positive.slice(0, 5);
    }
    if (data.frequent_terms.neutral && data.frequent_terms.neutral.length > 5) {
      data.frequent_terms.neutral = data.frequent_terms.neutral.slice(0, 5);
    }
    if (data.frequent_terms.negative && data.frequent_terms.negative.length > 5) {
      data.frequent_terms.negative = data.frequent_terms.negative.slice(0, 5);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Validate AI output fields (not just array length)
function validateAIOutput(data) {
  if (!data || typeof data !== 'object') {
    return 'Output is not an object';
  }
  
  const requiredFields = [
    'executive_summary',
    'key_insights',
    'positive_factors',
    'negative_issues',
    'content_ideas',
    'priority_actions',
    'strategic_recommendations',
    'limitations'
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  
  // Validate executive_summary is a non-empty string
  if (typeof data.executive_summary !== 'string' || data.executive_summary.trim().length === 0) {
    return 'executive_summary must be a non-empty string';
  }
  
  // Validate arrays have correct length AND non-empty objects
  const arrayFields = {
    key_insights: 3,
    positive_factors: 3,
    negative_issues: 3,
    content_ideas: 3,
    priority_actions: 3,
    strategic_recommendations: 3,
    limitations: 2
  };
  
  for (const [field, expectedLength] of Object.entries(arrayFields)) {
    if (!Array.isArray(data[field])) {
      return `${field} must be an array`;
    }
    if (data[field].length !== expectedLength) {
      return `${field} must have exactly ${expectedLength} items`;
    }
    
    // Check each item is not an empty object
    for (let i = 0; i < data[field].length; i++) {
      const item = data[field][i];
      if (!item || typeof item !== 'object' || Object.keys(item).length === 0) {
        return `${field}[${i}] is an empty object`;
      }
    }
  }
  
  // Validate key_insights have required fields (insight, data_basis)
  for (let i = 0; i < data.key_insights.length; i++) {
    const insight = data.key_insights[i];
    if (!insight.insight || (typeof insight.insight === 'string' && insight.insight.trim().length === 0)) {
      return `key_insights[${i}] missing or empty field: insight`;
    }
  }
  
  // Validate positive_factors have required fields (factor, data_basis)
  for (let i = 0; i < data.positive_factors.length; i++) {
    const factor = data.positive_factors[i];
    if (!factor.factor || (typeof factor.factor === 'string' && factor.factor.trim().length === 0)) {
      return `positive_factors[${i}] missing or empty field: factor`;
    }
  }
  
  // Validate negative_issues have required fields (issue, data_basis)
  for (let i = 0; i < data.negative_issues.length; i++) {
    const issue = data.negative_issues[i];
    if (!issue.issue || (typeof issue.issue === 'string' && issue.issue.trim().length === 0)) {
      return `negative_issues[${i}] missing or empty field: issue`;
    }
  }
  
  // Validate content_ideas have required fields
  for (let i = 0; i < data.content_ideas.length; i++) {
    const idea = data.content_ideas[i];
    const requiredIdeaFields = ['title', 'format', 'concept', 'call_to_action', 'data_basis'];
    for (const field of requiredIdeaFields) {
      if (!idea[field] || (typeof idea[field] === 'string' && idea[field].trim().length === 0)) {
        return `content_ideas[${i}] missing or empty field: ${field}`;
      }
    }
  }
  
  return null; // Validation passed
}
