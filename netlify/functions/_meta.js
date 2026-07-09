const GRAPH_BASE = "https://graph.facebook.com";

function getEnv() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igId = process.env.META_IG_ID;
  const version = process.env.META_API_VERSION || "v21.0";

  if (!token) throw new Error("META_ACCESS_TOKEN belum diisi di Environment Variables.");
  return { token, pageId, igId, version };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

async function graph(path, params = {}) {
  const { token, version } = getEnv();
  const url = new URL(`${GRAPH_BASE}/${version}/${path.replace(/^\//, "")}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  url.searchParams.set("access_token", token);

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    const message = data?.error?.message || `Graph API error ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function calculateEngagement(item) {
  const likes = Number(item.like_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const reach = Number(item.reach || item.views || item.video_views || 0);
  if (!reach) return "0%";
  return (((likes + comments + shares) / reach) * 100).toFixed(2) + "%";
}

module.exports = {
  getEnv,
  json,
  graph,
  calculateEngagement
};
