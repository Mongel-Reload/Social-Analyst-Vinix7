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
      console.log('[START IMAGE JOB] Background invocation URL:', backgroundUrl);
      
      const response = await fetch(backgroundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          recommendation: requestData.recommendation,
          sentimentContext: requestData.sentimentContext
        })
      });
      
      console.log('[START IMAGE JOB] Background function response:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Background functions return 202, don't parse JSON body
      if (response.status !== 202 && !response.ok) {
        const raw = await response.text();
        console.error('[START IMAGE JOB] Background function failed', raw.slice(0, 300));
        // Job is saved, continue anyway
      }
      
      console.log('[START IMAGE JOB] Background function triggered');
    } catch (invokeError) {
      console.error('[START IMAGE JOB] Failed to trigger background function', invokeError.message);
      // Job is saved, background function can be triggered separately
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
    const store = getStore('kokorolens-image-jobs');
    
    await store.setJSON(jobId, jobData);
    console.log('[START IMAGE JOB] Job saved to Blobs');
  } catch (e) {
    console.error('[START IMAGE JOB] Failed to save job', e.message);
    throw e;
  }
}
