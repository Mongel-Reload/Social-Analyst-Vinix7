const { getEnv, json, graph, calculateEngagement } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { igId } = getEnv();
    if (!igId) throw new Error("META_IG_ID belum diisi.");

    // Ambil media Instagram Business. Field yang tersedia bergantung izin token/app.
    const mediaRes = await graph(`/${igId}/media`, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights{metric_name,values}",
      limit: 25
    });

    const media = (mediaRes.data || []).map((item) => {
      // Extract insights data if available
      let insights = {};
      if (item.insights && item.insights.data) {
        item.insights.data.forEach(insight => {
          if (insight.name && insight.values && insight.values[0]) {
            insights[insight.name] = insight.values[0];
          }
        });
      }

      return {
        ...item,
        caption: item.caption ? item.caption.slice(0, 70) + (item.caption.length > 70 ? "..." : "") : item.id,
        share_count: insights.shares_count || 0,
        views: insights.video_views || insights.impressions || 0,
        reach: insights.reach || 0,
        engagement_rate: calculateEngagement(item),
        insight: "Media berhasil diambil dari Meta Graph API"
      };
    });

    const totalLikes = media.reduce((sum, item) => sum + Number(item.like_count || 0), 0);
    const totalComments = media.reduce((sum, item) => sum + Number(item.comments_count || 0), 0);
    const totalShares = media.reduce((sum, item) => sum + Number(item.share_count || 0), 0);
    const totalViews = media.reduce((sum, item) => sum + Number(item.views || 0), 0);
    const totalReach = media.reduce((sum, item) => sum + Number(item.reach || 0), 0);
    const totalPosts = media.length;
    
    // Use real reach if available, otherwise calculate from available metrics
    const reach = totalReach > 0 ? totalReach : Math.max(totalLikes * 12, totalComments * 80, 1);
    const engagementRate = reach > 0 ? (((totalLikes + totalComments) / reach) * 100).toFixed(2) : '0';

    return json(200, {
      ok: true,
      summary: {
        total_posts: totalPosts,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        views: totalViews,
        reach: totalReach > 0 ? totalReach : reach,
        engagement_rate: engagementRate,
        positive_sentiment: null // Will be updated after sentiment analysis
      },
      media
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
