const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { pageId, igId } = getEnv();

    let page = null;
    let instagram = null;

    if (pageId) {
      page = await graph(`/${pageId}`, {
        fields: "id,name,category,followers_count"
      });
    }

    if (igId) {
      instagram = await graph(`/${igId}`, {
        fields: "id,username,name,followers_count,media_count"
      });
    }

    return json(200, {
      ok: true,
      name: page?.name || instagram?.username || "Meta API",
      page,
      instagram
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
