const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const mediaId = event.queryStringParameters?.media_id;
    if (!mediaId) throw new Error("Parameter media_id wajib diisi.");

    const data = await graph(`/${mediaId}/comments`, {
      fields: "id,text,timestamp,username,like_count,replies{like_count,text}",
      limit: 50
    });

    const comments = (data.data || []).map((comment) => ({
      id: comment.id,
      username: comment.username,
      text: comment.text,
      timestamp: comment.timestamp,
      like_count: comment.like_count || 0,
      replies_count: comment.replies?.data?.length || 0
    }));

    return json(200, { 
      ok: true, 
      comments,
      total: comments.length
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
