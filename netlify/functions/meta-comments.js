const { json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const mediaId = event.queryStringParameters?.media_id;
    if (!mediaId) throw new Error("Parameter media_id wajib diisi.");

    const data = await graph(`/${mediaId}/comments`, {
      fields: "id,text,timestamp,username,like_count",
      limit: 100
    });

    // Catatan: analisis sentimen sungguhan dapat dihubungkan ke model Python/backend terpisah.
    const comments = (data.data || []).map((comment) => {
      const text = (comment.text || "").toLowerCase();
      let sentiment = "Netral";
      if (/(bagus|mantap|keren|suka|informatif|terbaik|membantu)/i.test(text)) sentiment = "Positif";
      if (/(buruk|jelek|kecewa|kurang|mahal|ribet|tidak jelas)/i.test(text)) sentiment = "Negatif";
      return { ...comment, sentiment };
    });

    return json(200, { ok: true, comments });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
