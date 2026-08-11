// Netlify Function to start image generation job (synchronous)
// This creates a job and triggers the background function
// Returns immediately with jobId

const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  console.log('[START IMAGE JOB] Request received');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: { type: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      })
    };
  }
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: { type: 'INVALID_JSON', message: 'Invalid JSON in request body' }
        })
      };
    }
    
    // Validate required fields
    if (!requestData.recommendation) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: { type: 'INVALID_PAYLOAD', message: 'Recommendation is required' }
        })
      };
    }
    
    // Generate unique job ID
    const jobId = uuidv4();
    console.log('[START IMAGE JOB] Created jobId:', jobId);
    
    // Initialize job in storage
    const jobData = {
      id: jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recommendationId: requestData.recommendationId || null,
      image: null,
      error: null
    };
    
    await saveJob(jobId, jobData);
    console.log('[START IMAGE JOB] Job initialized');
    
    // Trigger background function via internal HTTP call
    // This is a simple approach - in production you might use event triggers or queues
    try {
      const backgroundUrl = `${process.env.URL}/.netlify/functions/generate-content-image-background`;
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
          recommendation: requestData.recommendation,
          sentimentContext: requestData.sentimentContext,
          brandProfile: requestData.brandProfile
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
        console.error('[START IMAGE JOB] Background function failed', bgText.slice(0, 300));
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
      
      console.log('[START IMAGE JOB] Background function triggered');
    } catch (invokeError) {
      console.error('[START IMAGE JOB] Failed to trigger background function', invokeError.message);
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
        message: 'Image generation job started'
      })
    };
    
  } catch (error) {
    console.error('[START IMAGE JOB] Error', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: error.message || 'Failed to start image generation job'
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
      name: 'kokorolens-image-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[JOB CREATE]', {
      store: 'kokorolens-image-jobs',
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
    
    console.log('[START IMAGE JOB] Job saved to Blobs');
  } catch (e) {
    console.error('[START IMAGE JOB] Failed to save job', e.message);
    throw e;
  }
}

// Helper: Update job status in Netlify Blobs
async function updateJobStatus(jobId, status, error = null) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-image-jobs',
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
    console.log('[START IMAGE JOB] Job status updated', { jobId, status });
  } catch (e) {
    console.error('[START IMAGE JOB] Failed to update job status', e.message);
  }
}
