// Netlify Background Function for AI Image Generation using KoboiLLM
// This function runs asynchronously and can take up to 15 minutes
// Provider: KoboiLLM (OpenAI-compatible Images API)

// Legacy Netlify Functions background configuration
exports.config = {
  background: true
};

exports.handler = async (event, context) => {
  console.log('[BACKGROUND HANDLER ENTERED]', {
    timestamp: new Date().toISOString()
  });
  
  const startedAt = Date.now();
  console.log('[IMAGE JOB] started');
  
  // Parse job data from event
  let jobData;
  try {
    jobData = JSON.parse(event.body || '{}');
    console.log('[BACKGROUND JOB START]', {
      jobId: jobData.jobId
    });
  } catch (e) {
    console.error('[IMAGE JOB] Invalid job data');
    return { statusCode: 400, body: 'Invalid job data' };
  }
  
  const { jobId, recommendation, sentimentContext } = jobData;
  
  if (!jobId) {
    console.error('[IMAGE JOB] Missing jobId');
    return { statusCode: 400, body: 'Missing jobId' };
  }
  
  // Validate environment variables
  const apiKey = process.env.IMAGE_API_KEY?.trim();
  const baseUrl = (process.env.IMAGE_API_BASE_URL || '').replace(/\/+$/, '');
  const endpoint = '/' + (process.env.IMAGE_API_ENDPOINT || '').replace(/^\/+/, '');
  const model = process.env.IMAGE_MODEL?.trim();
  
  const finalUrl = `${baseUrl}${endpoint}`;
  
  console.log('[IMAGE JOB] API CONFIG', {
    finalUrl,
    model,
    hasApiKey: Boolean(apiKey)
  });
  
  if (!apiKey || !model) {
    console.error('[IMAGE JOB] Missing ENV configuration');
    await updateJobStatus(jobId, 'failed', { type: 'CONFIG_ERROR', message: 'Missing API configuration' });
    return { statusCode: 500, body: 'Missing configuration' };
  }
  
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing', null);
    console.log('[IMAGE JOB] status: processing');
    
    // TEMPORARY: Test architecture without KoboiLLM
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate completion with test data
    console.log('[IMAGE JOB] TEST MODE - Simulating completion');
    
    await updateJobStatus(jobId, 'completed', null, {
      type: 'url',
      value: 'https://via.placeholder.com/1024x1536/22d3ee/ffffff?text=Test+Image+Generation',
      test: true
    });
    
    console.log('[IMAGE JOB] TEST MODE - completed');
    return { statusCode: 200, body: 'Job completed (test mode)' };
    
    // REAL KOBOILLM CODE (commented out for testing)
    /*
    // Build prompt from recommendation
    const prompt = buildPrompt(recommendation, sentimentContext);
    console.log('[IMAGE JOB] Koboi request started');
    
    // Make request to KoboiLLM
    const payload = {
      model: model,
      prompt: prompt,
      size: '1024x1536',
      n: 1
    };
    
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const duration = Date.now() - startedAt;
    console.log('[IMAGE JOB] Koboi completed', { duration: `${duration}ms`, status: response.status });
    
    const rawBody = await response.text();
    
    if (!response.ok) {
      console.error('[IMAGE JOB] Koboi error', { status: response.status, body: rawBody.slice(0, 500) });
      await updateJobStatus(jobId, 'failed', {
        type: 'IMAGE_PROVIDER_ERROR',
        message: rawBody.slice(0, 500),
        providerStatus: response.status
      });
      return { statusCode: response.status, body: rawBody };
    }
    
    // Parse response
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('[IMAGE JOB] Non-JSON response');
      await updateJobStatus(jobId, 'failed', {
        type: 'IMAGE_PROVIDER_NON_JSON',
        message: `Non-JSON response: ${rawBody.slice(0, 500)}`
      });
      return { statusCode: 502, body: 'Non-JSON response' };
    }
    
    // Extract image
    const imageData = data?.data?.[0];
    if (!imageData) {
      console.error('[IMAGE JOB] No image data in response');
      await updateJobStatus(jobId, 'failed', {
        type: 'INVALID_RESPONSE',
        message: 'No image data in response'
      });
      return { statusCode: 502, body: 'No image data' };
    }
    
    // Prefer URL over base64
    const imageValue = imageData.url || imageData.b64_json;
    const imageType = imageData.url ? 'url' : 'base64';
    
    if (!imageValue) {
      console.error('[IMAGE JOB] No image value');
      await updateJobStatus(jobId, 'failed', {
        type: 'INVALID_RESPONSE',
        message: 'No image value in response'
      });
      return { statusCode: 502, body: 'No image value' };
    }
    
    console.log('[IMAGE JOB] completed', { imageType, hasValue: true });
    
    // Update job status to completed with image result
    await updateJobStatus(jobId, 'completed', null, {
      type: imageType,
      value: imageValue
    });
    
    return { statusCode: 200, body: 'Job completed' };
    */
    
  } catch (error) {
    console.error('[IMAGE JOB] Error', {
      name: error?.name,
      message: error?.message,
      causeCode: error?.cause?.code,
      causeMessage: error?.cause?.message
    });
    
    await updateJobStatus(jobId, 'failed', {
      type: 'IMAGE_FETCH_FAILED',
      message: error?.message || 'fetch failed',
      causeCode: error?.cause?.code || null,
      causeMessage: error?.cause?.message || null
    });
    
    return { statusCode: 500, body: 'Job failed' };
  }
};

// Helper: Build prompt from recommendation
function buildPrompt(recommendation, sentimentContext) {
  const title = recommendation?.title || '';
  const concept = recommendation?.concept || '';
  const callToAction = recommendation?.call_to_action || '';
  const dataBasis = recommendation?.data_basis || '';
  
  return `Create a polished professional Instagram feed marketing visual based on the following recommendation derived from social media sentiment analysis.

Recommendation:
${title}

Concept:
${concept}

Call to Action:
${callToAction}

Data Basis:
${dataBasis}

Audience:
Indonesian social media audience.

Requirements:
- modern professional digital marketing visual
- visually engaging
- clean composition
- strong focal point
- premium but approachable
- suitable for Instagram feed
- portrait orientation
- leave safe space around edges
- avoid fake logos
- avoid random unreadable text
- do not invent statistics or claims
- image should visually communicate the recommendation`;
}

// Helper: Update job status in Netlify Blobs
async function updateJobStatus(jobId, status, error = null, image = null) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-image-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[JOB UPDATE]', {
      store: 'kokorolens-image-jobs',
      jobId,
      key: jobId,
      status
    });
    
    const jobData = {
      id: jobId,
      status,
      updatedAt: new Date().toISOString(),
      ...(error && { error }),
      ...(image && { image })
    };
    
    await store.setJSON(jobId, jobData);
    console.log('[IMAGE JOB] Status updated', { jobId, status });
    
    // Verify update
    const verification = await store.get(jobId, { type: 'json' });
    console.log('[JOB UPDATE VERIFY]', {
      jobId,
      found: Boolean(verification),
      status: verification?.status || null,
      updatedAt: verification?.updatedAt || null
    });
  } catch (e) {
    console.error('[IMAGE JOB] Failed to update status', e.message);
  }
}
