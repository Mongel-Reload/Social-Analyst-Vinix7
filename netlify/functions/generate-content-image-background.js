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
    
    // Build prompt from recommendation
    const prompt = buildPrompt(recommendation, sentimentContext, jobData.brandProfile);
    console.log('[KOBOI REQUEST START]', {
      jobId,
      finalUrl,
      model,
      promptLength: prompt.length,
      size: '1024x1536'
    });
    
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
    const rawBody = await response.text();
    
    console.log('[KOBOI RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      contentType: response.headers.get('content-type'),
      bodyPreview: response.ok ? '[success response]' : rawBody.slice(0, 1000)
    });
    
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
      console.error('[IMAGE JOB] No image URL or base64 in response');
      await updateJobStatus(jobId, 'failed', {
        type: 'INVALID_RESPONSE',
        message: 'No image URL or base64 in response'
      });
      return { statusCode: 502, body: 'No image data' };
    }
    
    // Save completed job with image
    await updateJobStatus(jobId, 'completed', null, {
      type: imageType,
      value: imageValue
    });
    
    console.log('[IMAGE JOB] completed', { imageType, duration: `${duration}ms` });
    return { statusCode: 200, body: 'Job completed' };
    
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
function buildPrompt(recommendation, sentimentContext, brandProfile = null) {
  const title = recommendation?.title || '';
  const concept = recommendation?.concept || '';
  const callToAction = recommendation?.call_to_action || '';
  const dataBasis = recommendation?.data_basis || '';
  
  let brandInfo = '';
  if (brandProfile) {
    brandInfo = `
Brand Information:
- Brand Name: ${brandProfile.name || 'Not specified'}
- Industry: ${brandProfile.industry || 'Not specified'}
- Target Audience: ${brandProfile.audience || 'Indonesian social media audience'}
- Brand Colors: Primary ${brandProfile.primaryColor || '#22d3ee'}, Secondary ${brandProfile.secondaryColor || '#3b82f6'}, Accent ${brandProfile.accentColor || '#8b5cf6'}

`;
  }
  
  return `Create a polished professional Instagram feed marketing visual based on the following recommendation derived from social media sentiment analysis.

${brandInfo}Recommendation:
${title}

Concept:
${concept}

Call to Action:
${callToAction}

Data Basis:
${dataBasis}

Audience:
${brandProfile?.audience || 'Indonesian social media audience'}.

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
- image should visually communicate the recommendation
${brandProfile ? `- use brand colors ${brandProfile.primaryColor}, ${brandProfile.secondaryColor}, ${brandProfile.accentColor} as primary color palette` : ''}`;
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
