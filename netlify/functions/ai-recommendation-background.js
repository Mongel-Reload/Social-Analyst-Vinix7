// Netlify Background Function for AI Recommendation using Sylor API
// This function runs asynchronously and can take up to 15 minutes
// Provider: Sylor API (OpenAI-compatible)

// Legacy Netlify Functions background configuration
exports.config = {
  background: true
};

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
    
    // TEMPORARY: Test architecture without Sylor
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate completion with test data
    console.log('[AI RECOMMENDATION JOB] TEST MODE - Simulating completion');
    
    const testResult = {
      executive_summary: 'Test executive summary for AI recommendation',
      key_insights: [
        { insight: 'Test insight 1', data_basis: 'Test data basis 1' },
        { insight: 'Test insight 2', data_basis: 'Test data basis 2' },
        { insight: 'Test insight 3', data_basis: 'Test data basis 3' }
      ],
      content_ideas: [
        { title: 'Test Content 1', format: 'Reels', concept: 'Test concept 1', call_to_action: 'Test CTA 1', data_basis: 'Test basis 1' },
        { title: 'Test Content 2', format: 'Carousel', concept: 'Test concept 2', call_to_action: 'Test CTA 2', data_basis: 'Test basis 2' },
        { title: 'Test Content 3', format: 'Story', concept: 'Test concept 3', call_to_action: 'Test CTA 3', data_basis: 'Test basis 3' }
      ],
      priority_actions: [
        { action: 'Test action 1', reason: 'Test reason 1', success_metric: 'Test metric 1' },
        { action: 'Test action 2', reason: 'Test reason 2', success_metric: 'Test metric 2' },
        { action: 'Test action 3', reason: 'Test reason 3', success_metric: 'Test metric 3' }
      ],
      strategic_recommendations: [
        { recommendation: 'Test recommendation 1', rationale: 'Test rationale 1', expected_impact: 'Test impact 1' },
        { recommendation: 'Test recommendation 2', rationale: 'Test rationale 2', expected_impact: 'Test impact 2' },
        { recommendation: 'Test recommendation 3', rationale: 'Test rationale 3', expected_impact: 'Test impact 3' }
      ],
      limitations: [
        { limitation: 'Test limitation 1', mitigation: 'Test mitigation 1' },
        { limitation: 'Test limitation 2', mitigation: 'Test mitigation 2' }
      ]
    };
    
    await updateJobStatusWithResult(jobId, 'completed', null, testResult);
    
    console.log('[AI RECOMMENDATION JOB] TEST MODE - completed');
    return { statusCode: 200, body: 'Job completed (test mode)' };
    
    // REAL SYLOR CODE (commented out for testing)
    /*
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
    
    // Build prompt and call Sylor API
    // (Reuse logic from ai-recommendation.js here)
    */
    
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
