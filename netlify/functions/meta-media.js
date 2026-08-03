const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { igId } = getEnv();
    if (!igId) {
      return json(200, {
        success: false,
        error: {
          type: "META_CREDENTIAL_ERROR",
          message: "META_IG_ID belum diisi di Environment Variables."
        }
      });
    }

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 25;
    const after = params.after || null;
    const since = params.since || null;
    const until = params.until || null;

    // Build graph API parameters
    // Note: Some fields require additional permissions (instagram_basic, instagram_manage_insights)
    const graphParams = {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights{metric_name,values}",
      limit: Math.min(limit, 100) // Max 100 per request
    };

    if (after) graphParams.after = after;
    if (since) graphParams.since = since;
    if (until) graphParams.until = until;

    const mediaRes = await graph(`/${igId}/media`, graphParams);

    const media = (mediaRes.data || []).map((item) => {
      // Handle different media types
      let media_url = item.media_url;
      let thumbnail_url = item.thumbnail_url;

      // For CAROUSEL, media_url might not be available
      if (item.media_type === 'CAROUSEL_ALBUM') {
        media_url = null;
        thumbnail_url = null;
      }

      // For VIDEO, use thumbnail_url if available
      if (item.media_type === 'VIDEO' && !thumbnail_url) {
        thumbnail_url = item.media_url;
      }

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
        id: item.id,
        caption: item.caption || null,
        media_type: item.media_type,
        media_url: media_url,
        thumbnail_url: thumbnail_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        like_count: item.like_count || 0,
        comments_count: item.comments_count || 0,
        // Additional fields from insights (may not be available without proper permissions)
        shares_count: insights.shares_count || 0,
        reach: insights.reach || 0,
        impressions: insights.impressions || 0,
        saves: insights.saves || 0,
        video_views: insights.video_views || 0
      };
    });

    // Handle pagination
    const paging = {
      has_next: !!(mediaRes.paging && mediaRes.paging.next),
      after: mediaRes.paging?.cursors?.after || null
    };

    return json(200, {
      success: true,
      media,
      paging,
      total: media.length
    });
  } catch (error) {
    return json(200, {
      success: false,
      error: {
        type: "META_MEDIA_ERROR",
        message: error.message.includes("Permission")
          ? "Izin media tidak tersedia. Pastikan token memiliki permission instagram_basic."
          : error.message.includes("190")
          ? "Token Meta sudah kedaluwarsa. Silakan generate ulang access token."
          : error.message.includes("100")
          ? "Instagram Business Account ID tidak valid."
          : `Gagal mengambil media: ${error.message}`
      }
    });
  }
};
