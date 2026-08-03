const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const { pageId, igId, token } = getEnv();

    if (!token) {
      return json(200, {
        success: false,
        error: {
          type: "META_CREDENTIAL_ERROR",
          message: "META_ACCESS_TOKEN belum diisi di Environment Variables."
        }
      });
    }

    let page = null;
    let instagram = null;

    // Test token validity by fetching page info
    if (pageId) {
      try {
        page = await graph(`/${pageId}`, {
          fields: "id,name,category"
        });
      } catch (err) {
        // If page fetch fails, continue to check instagram
        console.error("Page fetch error:", err.message);
      }
    }

    // Test Instagram Business Account
    if (igId) {
      try {
        instagram = await graph(`/${igId}`, {
          fields: "id,username,name,followers_count,media_count"
        });
      } catch (err) {
        return json(200, {
          success: false,
          error: {
            type: "META_IG_ERROR",
            message: err.message.includes("Permission") 
              ? "Izin Instagram tidak tersedia. Pastikan token memiliki permission instagram_basic dan instagram_manage_comments."
              : err.message.includes("190")
              ? "Token Meta sudah kedaluwarsa. Silakan generate ulang access token."
              : err.message.includes("100")
              ? "Instagram Business Account ID tidak valid atau belum terhubung ke Facebook Page."
              : `Gagal mengambil data Instagram: ${err.message}`
          }
        });
      }
    }

    if (!page && !instagram) {
      return json(200, {
        success: false,
        error: {
          type: "META_NO_ACCOUNT",
          message: "Tidak ada Facebook Page atau Instagram Business Account yang terhubung. Pastikan META_PAGE_ID atau META_IG_ID diisi."
        }
      });
    }

    return json(200, {
      success: true,
      page: page ? {
        id: page.id,
        name: page.name
      } : null,
      instagram: instagram ? {
        id: instagram.id,
        username: instagram.username,
        name: instagram.name,
        followers_count: instagram.followers_count || 0,
        media_count: instagram.media_count || 0
      } : null,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    return json(200, {
      success: false,
      error: {
        type: "META_API_ERROR",
        message: error.message
      }
    });
  }
};
