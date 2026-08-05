const { json } = require("./_meta");

// ML Backend URL - configure this in Netlify environment variables
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:5000";

// Helper function for JSON responses
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

async function proxyToML(endpoint, method, body = null) {
  const url = `${ML_BACKEND_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `ML Backend error: ${response.status}`);
  }
  
  return data;
}

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, texts, csv_data } = body;
    
    // Handle CSV upload (new feature)
    if (csv_data) {
      if (!Array.isArray(csv_data)) {
        return jsonResponse(400, { 
          success: false,
          ok: false, 
          error: "csv_data must be an array of objects with 'komentar' field" 
        });
      }
      
      // Extract comments from CSV data
      const comments = csv_data
        .filter(row => row.komentar && typeof row.komentar === 'string')
        .map(row => ({
          text: row.komentar,
          tanggal_upload: row.tanggal_upload || null,
          username: row.username || null
        }));
      
      if (comments.length === 0) {
        return jsonResponse(400, { 
          success: false,
          ok: false, 
          error: "No valid comments found in csv_data" 
        });
      }
      
      // Batch prediction with linguistic features
      const texts = comments.map(c => c.text);
      const result = await proxyToML("/predict-batch", "POST", { texts });
      
      // Merge original data with predictions
      const results = result.results.map((pred, index) => ({
        ...comments[index],
        label: pred.label,
        confidence: pred.confidence,
        prob_positif: pred.prob_positif,
        prob_netral: pred.prob_netral,
        prob_negatif: pred.prob_negatif,
        linguistic_features: pred.linguistic_features
      }));
      
      return jsonResponse(200, {
        success: true,
        ok: true,
        results: results,
        total: results.length
      });
    }
    
    // Handle single text prediction
    if (text) {
      const result = await proxyToML("/predict", "POST", { text });
      return jsonResponse(200, {
        success: true,
        ok: true,
        result: result.result
      });
    }
    
    // Handle batch text prediction
    if (texts) {
      if (!Array.isArray(texts)) {
        return jsonResponse(400, { 
          success: false,
          ok: false, 
          error: "texts must be an array of strings" 
        });
      }
      
      const result = await proxyToML("/predict-batch", "POST", { texts });
      return jsonResponse(200, {
        success: true,
        ok: true,
        results: result.results,
        total: result.total
      });
    }
    
    return jsonResponse(400, { 
      success: false,
      ok: false, 
      error: "Missing 'text', 'texts', or 'csv_data' in request body" 
    });
    
  } catch (error) {
    console.error("ML Predict Error:", error);
    return jsonResponse(500, { 
      success: false,
      ok: false, 
      error: error.message 
    });
  }
};
