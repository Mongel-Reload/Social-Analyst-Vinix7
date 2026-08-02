const { json } = require("./_meta");

// ML Backend URL - configure this in Netlify environment variables
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:5000";

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
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { text, texts } = JSON.parse(event.body || "{}");
    
    if (!text && !texts) {
      return json(400, { ok: false, error: "Missing 'text' or 'texts' in request body" });
    }
    
    let result;
    
    if (text) {
      // Single prediction
      result = await proxyToML("/predict", "POST", { text });
    } else if (texts) {
      // Batch prediction
      result = await proxyToML("/predict-batch", "POST", { texts });
    }
    
    return json(200, result);
  } catch (error) {
    console.error("ML Predict Error:", error);
    return json(500, { ok: false, error: error.message });
  }
};
