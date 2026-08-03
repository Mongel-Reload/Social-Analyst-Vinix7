const { getEnv, json, graph } = require("./_meta");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    const mediaId = event.queryStringParameters?.media_id;
    if (!mediaId) {
      return json(200, {
        success: false,
        error: {
          type: "INVALID_PARAMETER",
          message: "Parameter media_id wajib diisi."
        }
      });
    }

    // Validate media_id format (should be numeric)
    if (!/^\d+$/.test(mediaId)) {
      return json(200, {
        success: false,
        error: {
          type: "INVALID_PARAMETER",
          message: "Format media_id tidak valid. Media ID harus berupa angka."
        }
      });
    }

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 50;
    const after = params.after || null;

    // Build graph API parameters
    const graphParams = {
      fields: "id,text,timestamp,username,like_count,replies{like_count,text}",
      limit: Math.min(limit, 100) // Max 100 per request
    };

    if (after) graphParams.after = after;

    const data = await graph(`/${mediaId}/comments`, graphParams);

    // Check if comments exist
    if (!data.data || data.data.length === 0) {
      return json(200, {
        success: true,
        media_id: mediaId,
        comments: [],
        paging: {
          has_next: false,
          after: null
        },
        total: 0,
        message: "Postingan ini belum memiliki komentar."
      });
    }

    const comments = (data.data || []).map((comment) => ({
      id: comment.id,
      username: comment.username,
      text: comment.text,
      timestamp: comment.timestamp,
      like_count: comment.like_count || 0,
      replies_count: comment.replies?.data?.length || 0
    }));

    // Handle pagination
    const paging = {
      has_next: !!(data.paging && data.paging.next),
      after: data.paging?.cursors?.after || null
    };

    return json(200, {
      success: true,
      media_id: mediaId,
      comments,
      paging,
      total: comments.length
    });
  } catch (error) {
    // Distinguish between different error types
    let errorType = "META_COMMENTS_ERROR";
    let errorMessage = error.message;

    if (error.message.includes("Permission")) {
      errorType = "META_PERMISSION_ERROR";
      errorMessage = "Izin komentar tidak tersedia. Pastikan token memiliki permission instagram_manage_comments.";
    } else if (error.message.includes("190")) {
      errorType = "META_TOKEN_EXPIRED";
      errorMessage = "Token Meta sudah kedaluwarsa. Silakan generate ulang access token.";
    } else if (error.message.includes("100") || error.message.includes("Invalid parameter")) {
      errorType = "META_MEDIA_NOT_FOUND";
      errorMessage = "Media ID tidak valid atau postingan tidak ditemukan. Pastikan Media ID benar.";
    } else if (error.message.includes("Unsupported get request")) {
      errorType = "META_COMMENTS_DISABLED";
      errorMessage = "Komentar dinonaktifkan untuk postingan ini atau akun bukan Instagram Business.";
    } else if (error.message.includes("Application does not have permission")) {
      errorType = "META_PERMISSION_ERROR";
      errorMessage = "Aplikasi tidak memiliki izin untuk mengambil komentar. Hubungi administrator.";
    }

    return json(200, {
      success: false,
      error: {
        type: errorType,
        message: errorMessage
      }
    });
  }
};
