const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { igId } = getEnv();
    if (!igId) throw new Error("META_IG_ID belum diisi.");

    const data = await graph(`/${igId}/media`, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
      limit: 50
    });

    return json(200, { ok: true, media: data.data || [] });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
