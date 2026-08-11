// Netlify Function to start AI Recommendation job (async)
// This function initiates the job and returns immediately with a jobId
// The actual AI processing happens in the background function

const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  console.log('[START AI RECOMMENDATION] Function started');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const requestData = JSON.parse(event.body);
    console.log('[START AI RECOMMENDATION] Request parsed');
    
    // Generate unique jobId
    const jobId = uuidv4();
    console.log('[START AI RECOMMENDATION] Generated jobId:', jobId);
    
    // Initialize job data
    const jobData = {
      id: jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestData: requestData,
      result: null,
      error: null
    };
    
    // Save job to Netlify Blobs
    await saveJob(jobId, jobData);
    console.log('[START AI RECOMMENDATION] Job initialized');
    
    // Trigger background function via internal HTTP call
    try {
      const backgroundUrl = `${process.env.URL}/.netlify/functions/ai-recommendation-background`;
      console.log('[BACKGROUND URL]', {
        envURL: process.env.URL,
        backgroundUrl
      });
      
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          requestData
        })
      });
      
      const bgText = await bgResponse.text();
      
      console.log('[BACKGROUND INVOCATION RESPONSE]', {
        url: backgroundUrl,
        status: bgResponse.status,
        statusText: bgResponse.statusText,
        contentType: bgResponse.headers.get('content-type'),
        bodyPreview: bgText.slice(0, 500)
      });
      
      // Background functions should return 202
      if (bgResponse.status !== 202 && !bgResponse.ok) {
        console.error('[START AI RECOMMENDATION] Background function failed', bgText.slice(0, 300));
        // Mark job as failed
        await updateJobStatus(jobId, 'failed', {
          type: 'BACKGROUND_INVOCATION_FAILED',
          message: `Background function returned HTTP ${bgResponse.status}`
        });
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: {
              type: 'BACKGROUND_INVOCATION_FAILED',
              message: `Background function returned HTTP ${bgResponse.status}`
            }
          })
        };
      }
      
      console.log('[START AI RECOMMENDATION] Background function triggered');
    } catch (invokeError) {
      console.error('[START AI RECOMMENDATION] Failed to trigger background function', invokeError.message);
      // Mark job as failed
      await updateJobStatus(jobId, 'failed', {
        type: 'BACKGROUND_INVOCATION_ERROR',
        message: invokeError.message
      });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            type: 'BACKGROUND_INVOCATION_ERROR',
            message: invokeError.message
          }
        })
      };
    }
    
    // Return immediately with jobId
    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        jobId,
        status: 'pending',
        message: 'AI recommendation job started'
      })
    };
    
  } catch (error) {
    console.error('[START AI RECOMMENDATION] Error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: error.message
        }
      })
    };
  }
};

// Helper: Save job to Netlify Blobs
async function saveJob(jobId, jobData) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-ai-recommendation-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[JOB CREATE]', {
      store: 'kokorolens-ai-recommendation-jobs',
      jobId,
      key: jobId
    });
    
    await store.setJSON(jobId, jobData);
    
    // Verify write before returning
    const verification = await store.get(jobId, { type: 'json' });
    console.log('[JOB WRITE VERIFY]', {
      jobId,
      found: Boolean(verification),
      status: verification?.status || null
    });
    
    if (!verification) {
      throw new Error('Blob write verification failed - job not found after write');
    }
    
    console.log('[START AI RECOMMENDATION] Job saved to Blobs');
  } catch (e) {
    console.error('[START AI RECOMMENDATION] Failed to save job', e.message);
    throw e;
  }
}

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
    
    const jobData = {
      id: jobId,
      status,
      updatedAt: new Date().toISOString(),
      ...(error && { error })
    };
    
    await store.setJSON(jobId, jobData);
    console.log('[START AI RECOMMENDATION] Job status updated', { jobId, status });
  } catch (e) {
    console.error('[START AI RECOMMENDATION] Failed to update job status', e.message);
  }
}
