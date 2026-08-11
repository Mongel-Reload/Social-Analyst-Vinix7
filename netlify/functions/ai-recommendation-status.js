// Netlify Function to retrieve AI Recommendation job status
// This function polls the job status from Netlify Blobs

exports.handler = async (event, context) => {
  console.log('[AI RECOMMENDATION STATUS] Function started');
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }
  
  try {
    // Get jobId from query parameters
    const jobId = event.queryStringParameters?.id;
    
    if (!jobId) {
      console.error('[AI RECOMMENDATION STATUS] Missing jobId parameter');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing jobId parameter' })
      };
    }
    
    console.log('[AI RECOMMENDATION STATUS] Querying job:', jobId);
    
    // Get job from Netlify Blobs
    const jobData = await getJob(jobId);
    
    if (!jobData) {
      console.warn('[AI RECOMMENDATION STATUS] Job not found:', jobId);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: {
            type: 'JOB_NOT_FOUND',
            message: 'AI recommendation job not found'
          }
        })
      };
    }
    
    console.log('[AI RECOMMENDATION STATUS] Job found:', {
      jobId,
      status: jobData.status
    });
    
    // Return job status
    if (jobData.status === 'completed') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          status: jobData.status,
          result: jobData.result
        })
      };
    }
    
    if (jobData.status === 'failed') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          status: jobData.status,
          error: jobData.error
        })
      };
    }
    
    // pending or processing
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: jobData.status
      })
    };
    
  } catch (error) {
    console.error('[AI RECOMMENDATION STATUS] Error:', error.message);
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

// Helper: Get job from Netlify Blobs
async function getJob(jobId) {
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({
      name: 'kokorolens-ai-recommendation-jobs',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
      consistency: 'strong'
    });
    
    console.log('[AI JOB READ]', {
      store: 'kokorolens-ai-recommendation-jobs',
      jobId,
      key: jobId
    });
    
    const jobData = await store.get(jobId, { type: 'json' });
    
    if (!jobData) {
      console.warn('[AI JOB NOT FOUND]', {
        jobId,
        store: 'kokorolens-ai-recommendation-jobs'
      });
    }
    
    return jobData;
  } catch (e) {
    if (e.message?.includes('not found') || e.status === 404) {
      console.warn('[AI JOB NOT FOUND]', {
        jobId,
        store: 'kokorolens-ai-recommendation-jobs'
      });
      return null;
    }
    console.error('[AI RECOMMENDATION STATUS] Failed to get job', e.message);
    throw e;
  }
}
