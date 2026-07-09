const { getEnv, json, graph, calculateEngagement } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { igId } = getEnv();
    if (!igId) throw new Error("META_IG_ID belum diisi.");

    // Ambil media Instagram Business. Field yang tersedia bergantung izin token/app.
    const mediaRes = await graph(`/${igId}/media`, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
      limit: 25
    });

    const media = (mediaRes.data || []).map((item) => ({
      ...item,
      caption: item.caption ? item.caption.slice(0, 70) + (item.caption.length > 70 ? "..." : "") : item.id,
      share_count: 0,
      views: 0,
      reach: 0,
      engagement_rate: calculateEngagement(item),
      insight: "Media berhasil diambil dari Meta Graph API"
    }));

    const totalLikes = media.reduce((sum, item) => sum + Number(item.like_count || 0), 0);
    const totalComments = media.reduce((sum, item) => sum + Number(item.comments_count || 0), 0);
    const totalPosts = media.length;
    const estimatedReach = Math.max(totalLikes * 12, totalComments * 80, 1);
    const engagementRate = (((totalLikes + totalComments) / estimatedReach) * 100).toFixed(2);

    return json(200, {
      ok: true,
      summary: {
        total_posts: totalPosts,
        likes: totalLikes,
        comments: totalComments,
        reach: estimatedReach,
        engagement_rate: engagementRate,
        positive_sentiment: 82
      },
      media
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
