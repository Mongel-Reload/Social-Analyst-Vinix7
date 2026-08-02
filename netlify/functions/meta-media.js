const { getEnv, json, graph, calculateEngagement } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { igId } = getEnv();
    if (!igId) throw new Error("META_IG_ID belum diisi.");

    const mediaRes = await graph(`/${igId}/media`, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights{metric_name,value}",
      limit: 25
    });

    const media = (mediaRes.data || []).map((item) => {
      const insights = item.insights?.data || [];
      const reachData = insights.find(i => i.metric_name === 'reach');
      const impressionsData = insights.find(i => i.metric_name === 'impressions');
      const engagementData = insights.find(i => i.metric_name === 'engagement');
      
      return {
        id: item.id,
        caption: item.caption ? item.caption.slice(0, 70) + (item.caption.length > 70 ? "..." : "") : item.id,
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        like_count: item.like_count || 0,
        comments_count: item.comments_count || 0,
        share_count: 0,
        views: item.media_type === 'VIDEO' ? (impressionsData?.value || 0) : 0,
        reach: reachData?.value || 0,
        engagement_rate: calculateEngagement({
          like_count: item.like_count,
          comments_count: item.comments_count,
          share_count: 0,
          reach: reachData?.value || 0,
          views: item.media_type === 'VIDEO' ? (impressionsData?.value || 0) : 0
        }),
        insight: "Media diambil dari Meta Graph API (Data Aktual)"
      };
    });

    const totalLikes = media.reduce((sum, item) => sum + Number(item.like_count || 0), 0);
    const totalComments = media.reduce((sum, item) => sum + Number(item.comments_count || 0), 0);
    const totalPosts = media.length;
    const totalReach = media.reduce((sum, item) => sum + Number(item.reach || 0), 0);
    const engagementRate = totalReach > 0 ? (((totalLikes + totalComments) / totalReach) * 100).toFixed(2) : "0";

    return json(200, {
      ok: true,
      summary: {
        total_posts: totalPosts,
        likes: totalLikes,
        comments: totalComments,
        reach: totalReach,
        engagement_rate: engagementRate,
        positive_sentiment: null
      },
      media
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};
