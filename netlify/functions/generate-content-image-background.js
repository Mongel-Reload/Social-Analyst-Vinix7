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
      size: '1024x1280'
    });
    
    // Make request to KoboiLLM
    const payload = {
      model: model,
      prompt: prompt,
      size: '1024x1280',
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
  
  // Determine layout type based on recommendation content
  const layoutType = determineLayoutType(concept, title);
  
  // Use VINIX7 as brand name for content generation
  const brandName = brandProfile?.name || 'VINIX7';
  
  let brandInfo = '';
  if (brandProfile) {
    brandInfo = `
Brand Information:
- Brand Name: ${brandName} (VINIX7)
- Industry: ${brandProfile.industry || 'Not specified'}
- Target Audience: ${brandProfile.audience || 'Indonesian social media audience'}
- Brand Colors: Primary ${brandProfile.primaryColor || '#22d3ee'}, Secondary ${brandProfile.secondaryColor || '#3b82f6'}, Accent ${brandProfile.accentColor || '#8b5cf6'}

`;
  }
  
  return `Create a polished professional Instagram feed marketing visual for VINIX7 based on the following recommendation derived from social media sentiment analysis.

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

Layout Type:
${layoutType}

DESIGN SYSTEM:

Design:
- Instagram feed portrait 4:5 composition (1024x1280px)
- Generate natively for 4:5 ratio - do not use letterboxing or padding
- Fill entire canvas edge-to-edge with content
- Clean modern professional social-media layout
- Strong visual hierarchy
- Generous whitespace
- Clear separation between headline, supporting information, visual subject, and CTA
- Avoid crowded poster composition
- Avoid excessive decorative elements

Layout:
- Native Instagram portrait 4:5 composition (1024x1280px)
- ALL visual elements must fit completely inside the image
- Nothing may continue beyond the bottom edge
- Keep ~6% safe margin on all sides from edges
- Reserve a dedicated logo area in TOP-RIGHT corner specifically
- Nothing may overlap the logo area - keep it visually clean with clear space around logo
- Logo must never overlap headline, face, card, badge, icon, or decoration
- Headline maximum 2-3 lines and must not dominate more than ~25% of canvas height
- Human subject maximum ~45% of canvas width
- Information cards must remain large and readable - do not shrink them
- Reserve the bottom 12% specifically for ONE final CTA
- CTA must be fully visible with bottom safe margin
- Never crop headline, logo, CTA, or information cards
- Use clean grid alignment and consistent spacing
- Avoid excessive decorative elements
- Prioritize readability over filling empty space
- Maximum 4 information cards
- Do not create additional cards/sections below the CTA
- Before finalizing the composition, ensure headline, person, cards, logo-safe-area and CTA are fully visible
- Prefer less text and larger spacing rather than adding more vertical sections
- The bottom CTA must have visible padding below it
- All content inside safe margins (~6% from edges)
- Keep headline, cards, people, CTA and important visual elements away from the outer crop area
- Large readable headline in upper area
- Supporting information grouped into maximum 3-4 clean cards
- Cards must have consistent size, spacing, padding, border radius, and alignment
- Use one main human/visual subject positioned primarily on one side
- Do not place important text over the person's face/body
- CTA should have its own clearly separated area near the bottom
- Maintain safe margins around all edges

Visual Hierarchy (top to bottom):
1. Logo area (reserved clean TOP-RIGHT corner for VINIX7 logo - never overlap with headline or badges)
2. Headline (main headline large bold navy, secondary headline with navy + yellow accent)
3. Short supporting text (subheadline)
4. Main visual + information cards
5. CTA (bottom with safe margin)

FAQ CONTENT SPECIFIC (when layout type is Q&A / FAQ):
- Main headline: "FAQ MAGANG VINIX7" (large, bold, navy blue)
- Secondary headline: "Semester, Jurusan, dan Kualifikasi" (navy + yellow accent combination)
- Subheadline: "Temukan jawaban dari pertanyaan yang paling sering ditanyakan seputar program magang."
- Use exactly 3 vertical FAQ cards with specific content:
  Card 1: Question "Semester berapa yang bisa mendaftar?" Answer "Ketentuan semester dapat menyesuaikan posisi yang tersedia. Cek persyaratan pada setiap lowongan." Icon: Graduation cap
  Card 2: Question "Apakah harus dari jurusan tertentu?" Answer "Kebutuhan jurusan menyesuaikan kualifikasi setiap posisi magang. Cek detail pada lowongan yang tersedia." Icon: Book/education
  Card 3: Question "Apakah latar belakang saya sesuai?" Answer "Kesesuaian kandidat bergantung pada persyaratan dan kualifikasi setiap posisi. Pastikan sesuai dengan informasi pada lowongan." Icon: Candidate/profile + check mark
- CTA at bottom with two parts: Left "Cek persyaratan pada lowongan VINIX7 yang tersedia" (search icon), Right "Pantau informasi terbaru di kanal resmi VINIX7" (notification icon)
- Keep CTA clean with sufficient whitespace
- Talent on right side, FAQ cards on left side
- Ensure talent body does not cover cards or text

Typography:
- Headline = largest
- Card title = medium/bold
- Supporting copy = smaller but clearly readable on mobile
- Maximum 2 font styles
- Avoid tiny text
- Avoid long paragraphs inside the image
- Maximum 1-3 lines per card body text

Branding:
- Use Brand Profile colors consistently: primary → dominant, secondary → supporting, accent → CTA/highlights, neutral/white → readability
- Do NOT randomly introduce unrelated dominant colors
- Brand name in content should be VINIX7

Logo:
- Do NOT generate/recreate the company logo
- Reserve a visually clean logo-safe area in one corner (top-left, top-right, bottom-left, or bottom-right)
- The real uploaded VINIX7 logo will be overlaid afterward
- Do NOT render a visible logo placeholder, box, border, safe-zone, or fake logo
- Do NOT use "KokoroLens" as the brand name in the poster content

Content Structure:
- Maximum: 1 headline, optional short subheadline, maximum 4 information cards, 1 CTA
- If available grounded information is insufficient, use fewer cards (not more)
- NEVER fill empty space by inventing facts
- NEVER use placeholder text like "belum tersedia" (not available)
- If specific factual information is missing, use safe/general guidance instead

SAFE WORDING EXAMPLES (use when specific data unavailable):
- Instead of "Minimal semester belum tersedia" → "Ketentuan semester dapat menyesuaikan posisi yang tersedia. Cek persyaratan pada lowongan."
- Instead of "Jurusan belum tersedia" → "Kebutuhan jurusan menyesuaikan kualifikasi setiap posisi magang."
- Instead of "Cara daftar belum tersedia" → "Pantau informasi lowongan dan ikuti petunjuk pendaftaran pada kanal resmi VINIX7."

IMPORTANT:
- This is a DESIGN SYSTEM, not one fixed template
- Allow different compositions depending on content type
- Every result must remain clean, balanced, mobile-readable, and professionally structured

CRITICAL CONSTRAINTS - DO NOT INVENT FACTS:
- Do NOT invent minimum semester requirements
- Do NOT invent education requirements
- Do NOT invent registration requirements
- Do NOT invent document requirements
- Do NOT invent dates or deadlines
- Do NOT invent benefits or perks
- Do NOT invent recruitment stages
- Do NOT invent company policies
- Do NOT invent statistics or numbers
- Do NOT invent any factual company information not provided in this brief
- Only use factual claims that exist in the actual analysis data, recommendation data, or Brand Profile
- If factual information is unavailable, use safe/general wording instead
- Creative headlines and CTA are allowed, but invented company facts are NOT allowed
- NEVER use "belum tersedia" or similar placeholder text in the final image
- Use insight from comments as basis for content topics
- Do NOT convert questions or assumptions from comments into official company facts
- If requirement information is not available in dataset or brand profile, use safe wording like "cek persyaratan pada lowongan yang tersedia" or "ikuti informasi resmi VINIX7"`;
}

// Helper: Determine layout type based on recommendation content
function determineLayoutType(concept, title) {
  const text = (concept + ' ' + title).toLowerCase();
  
  if (text.includes('faq') || text.includes('question') || text.includes('pertanyaan')) {
    return 'Q&A / FAQ layout';
  }
  if (text.includes('education') || text.includes('learn') || text.includes('belajar') || text.includes('tutorial')) {
    return 'Simple infographic';
  }
  if (text.includes('awareness') || text.includes('informasi') || text.includes('know') || text.includes('tahu')) {
    return 'Visual-dominant';
  }
  if (text.includes('announcement') || text.includes('pengumuman') || text.includes('launch') || text.includes('rilis')) {
    return 'Announcement / poster';
  }
  if (text.includes('engagement') || text.includes('interaksi') || text.includes('survey') || text.includes('poll')) {
    return 'Question + CTA';
  }
  if (text.includes('tips') || text.includes('trick') || text.includes('cara') || text.includes('how to')) {
    return 'Concise tips layout';
  }
  
  // Default: clean visual with headline
  return 'Clean visual with headline and supporting points';
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
