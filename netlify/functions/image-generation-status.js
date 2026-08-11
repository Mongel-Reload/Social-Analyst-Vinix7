// Netlify Function to check image generation job status (synchronous)
// Returns current job status and result if completed

exports.handler = async (event, context) => {
  console.log('[IMAGE STATUS] Request received');
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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
    // Get jobId from query parameters
    const jobId = event.queryStringParameters?.id;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: { type: 'INVALID_REQUEST', message: 'Job ID is required' }
        })
      };
    }
    
    console.log('[IMAGE STATUS] Checking jobId:', jobId);
    
    // Retrieve job from storage
    const jobData = await getJob(jobId);
    
    if (!jobData) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: { type: 'JOB_NOT_FOUND', message: 'Job not found' }
        })
      };
    }
    
    console.log('[IMAGE STATUS] Job found', { status: jobData.status });
    
    // Return job status
    const response = {
      success: true,
      jobId: jobData.id,
      status: jobData.status,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt
    };
    
    // Include image if completed
    if (jobData.status === 'completed' && jobData.image) {
      response.image = jobData.image;
    }
    
    // Include error if failed
    if (jobData.status === 'failed' && jobData.error) {
      response.error = jobData.error;
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('[IMAGE STATUS] Error', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: error.message || 'Failed to check job status'
        }
      })
    };
  }
};

// Helper: Get job from Netlify Blobs
async function getJob(jobId) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-image-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[JOB READ]', {
      store: 'kokorolens-image-jobs',
      jobId,
      key: jobId
    });
    
    const jobData = await store.get(jobId, { type: 'json' });
    
    if (!jobData) {
      console.warn('[JOB NOT FOUND]', {
        jobId,
        store: 'kokorolens-image-jobs'
      });
    }
    
    return jobData;
  } catch (e) {
    if (e.message?.includes('not found') || e.status === 404) {
      console.warn('[JOB NOT FOUND]', {
        jobId,
        store: 'kokorolens-image-jobs'
      });
      return null;
    }
    console.error('[IMAGE STATUS] Failed to get job', e.message);
    throw e;
  }
}
