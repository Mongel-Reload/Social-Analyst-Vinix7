# Meta Graph API Setup Guide

Panduan lengkap untuk mengatur Meta Graph API integrasi dengan aplikasi Social Analyst Vinix7.

## 1. Cara Membuat Meta App

1. Buka [Meta Developers Portal](https://developers.facebook.com/)
2. Login dengan akun Facebook yang memiliki akses ke Instagram Business
3. Klik "Create App" → "Business" → "Next"
4. Isi nama aplikasi (contoh: "Social Analyst Vinix7")
5. Pilih email kontak
6. Klik "Create App ID"
7. Catat **App ID** dan **App Secret** (jangan bagikan App Secret)

## 2. Cara Menghubungkan Facebook Page

1. Di Meta App Dashboard, pilih aplikasi yang baru dibuat
2. Masuk ke "App Settings" → "Basic"
3. Scroll ke bagian "Platform"
4. Tambahkan platform "Website"
5. Masukkan URL website Netlify Anda
6. Klik "Save Changes"

## 3. Cara Menghubungkan Instagram Business Account

1. Pastikan akun Instagram sudah dikonversi menjadi **Instagram Business Account**
2. Akun Instagram harus terhubung ke **Facebook Page**
3. Di Meta App Dashboard:
   - Masuk ke "Products" → "Instagram Graph API"
   - Klik "Add" atau "Set Up"
   - Pilih Instagram Business Account yang ingin dihubungkan
4. Catat **Instagram Business Account ID** (format: 17841400000000000)

## 4. Cara Memperoleh Access Token

### A. Generate User Access Token

1. Di Meta App Dashboard:
   -masuk ke "Tools & Testing" → "Access Token Tool"
   - Pilih User dan Permissions yang dibutuhkan
   - Klik "Generate Access Token"
2. Catat **User Access Token**

### B. Generate Long-Lived Access Token (Recommended)

1. Gunakan Graph API Explorer:
   ```
   GET /oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id={app-id}
   &client_secret={app-secret}
   &fb_exchange_token={short-lived-token}
   ```
2. Catat **Long-Lived Access Token** (berlaku 60 hari)

### C. Generate Page Access Token (Recommended)

1. Gunakan Graph API Explorer:
   ```
   GET /{page-id}
   ?fields=access_token
   &access_token={user-access-token}
   ```
2. Catat **Page Access Token**

## 5. Permission yang Dibutuhkan

Untuk integrasi ini, permission berikut diperlukan:

- **pages_show_list** - Untuk melihat daftar Facebook Page
- **pages_read_engagement** - Untuk membaca engagement data
- **instagram_basic** - Untuk membaca data Instagram dasar (media, caption, dll)
- **instagram_manage_comments** - Untuk membaca komentar Instagram
- **instagram_manage_insights** - Untuk membaca insights data (reach, impressions, dll)
- **business_management** - Untuk manajemen business account

### Cara Menambahkan Permission

1. Di Meta App Dashboard:
   - Masuk ke "App Review" → "Permissions and Features"
   - Klik "Request" untuk permission yang dibutuhkan
   - Berikan alasan penggunaan permission
   - Submit untuk review
2. Untuk development, gunakan "Test Mode" untuk skip review

## 6. Cara Mengisi Environment Variable di Netlify

### A. Via Netlify Dashboard

1. Buka Netlify Dashboard
2. Pilih project "Social Analyst Vinix7"
3. Masuk ke "Site Settings" → "Environment Variables"
4. Tambahkan variables berikut:

| Variable | Value | Deskripsi |
|----------|-------|----------|
| `META_ACCESS_TOKEN` | {Page Access Token} | Token untuk akses Meta Graph API |
| `META_PAGE_ID` | {Facebook Page ID} | ID Facebook Page yang terhubung ke Instagram |
| `META_IG_ID` | {Instagram Business ID} | ID Instagram Business Account |
| `META_API_VERSION` | `v21.0` | Versi Meta Graph API yang digunakan |

5. Klik "Save"
6. Deploy ulang site

### B. Via Netlify CLI

```bash
netlify env:set META_ACCESS_TOKEN "your-access-token"
netlify env:set META_PAGE_ID "your-page-id"
netlify env:set META_IG_ID "your-ig-id"
netlify env:set META_API_VERSION "v21.0"
```

## 7. Cara Menguji meta-test

### Via Browser

1. Buka website yang sudah di-deploy
2. Masuk ke halaman "Meta API"
3. Klik "Uji Koneksi"
4. Hasil yang diharapkan:
   - Jika berhasil: Menampilkan nama Facebook Page dan Instagram Business Account
   - Jika gagal: Menampilkan pesan error yang spesifik

### Via cURL

```bash
curl https://your-site.netlify.app/.netlify/functions/meta-test
```

Response sukses:
```json
{
  "success": true,
  "page": {
    "id": "PAGE_ID",
    "name": "PT Vinix Seven Aurum"
  },
  "instagram": {
    "id": "IG_ID",
    "username": "vinixsevenaurum",
    "name": "Vinix Seven Aurum",
    "followers_count": 1000,
    "media_count": 100
  },
  "checked_at": "2026-08-03T00:00:00.000Z"
}
```

## 8. Cara Menguji meta-media

### Via Browser

1. Setelah koneksi berhasil, daftar postingan akan otomatis muncul
2. Atau gunakan cURL:

```bash
curl "https://your-site.netlify.app/.netlify/functions/meta-media?limit=25"
```

Response sukses:
```json
{
  "success": true,
  "media": [
    {
      "id": "MEDIA_ID",
      "caption": "Caption postingan",
      "media_type": "IMAGE",
      "media_url": "https://...",
      "thumbnail_url": "https://...",
      "permalink": "https://instagram.com/p/...",
      "timestamp": "2026-08-01T00:00:00.000Z",
      "like_count": 100,
      "comments_count": 20
    }
  ],
  "paging": {
    "has_next": true,
    "after": "CURSOR"
  },
  "total": 25
}
```

## 9. Cara Menguji meta-comments

### Via Browser

1. Di halaman Meta API, klik "Analisis Komentar" pada postingan
2. Atau gunakan cURL:

```bash
curl "https://your-site.netlify.app/.netlify/functions/meta-comments?media_id=MEDIA_ID"
```

Response sukses:
```json
{
  "success": true,
  "media_id": "MEDIA_ID",
  "comments": [
    {
      "id": "COMMENT_ID",
      "username": "pengguna",
      "text": "Komentar aktual",
      "timestamp": "2026-08-01T00:00:00.000Z",
      "like_count": 1
    }
  ],
  "paging": {
    "has_next": false,
    "after": null
  },
  "total": 1
}
```

## 10. Cara Menangani Token Kedaluwarsa

### Cek Token Status

Token akan menampilkan error jika sudah kedaluwarsa:
```
Meta API Token Expired: Access token has expired. Silakan generate ulang access token.
```

### Generate Ulang Token

1. Buka Meta Developers Portal
2. Masuk ke "Tools & Testing" → "Access Token Tool"
3. Generate ulang access token
4. Update `META_ACCESS_TOKEN` di Netlify Environment Variables
5. Deploy ulang site

### Otomatisasi Refresh Token

Untuk production, gunakan Long-Lived Access Token (60 hari) atau implementasi token refresh mechanism.

## 11. Keterbatasan API

### Rate Limits

- **Instagram Graph API**: ~200 calls per hour per user
- **Comments API**: ~200 calls per hour per user
- **Media API**: ~200 calls per hour per user

### Data Availability

- **Insights data**: Hanya tersedia untuk Instagram Business Account
- **Comments**: Hanya tersedia jika komentar tidak dinonaktifkan
- **Historical data**: Meta API hanya menyimpan data hingga 2 tahun ke belakang

### Permission Restrictions

- Beberapa permission memerlukan review oleh Meta
- Permission `instagram_manage_comments` memerlukan alasan penggunaan yang jelas
- Test Mode hanya bisa digunakan oleh user yang terdaftar sebagai Tester

## 12. Perbedaan Data Aktual dan Data Estimasi

### Data Aktual (Meta Graph API)

- **Sumber**: Langsung dari Instagram Business Account
- **Akurasi**: 100% (data asli)
- **Fields**: like_count, comments_count, reach, impressions, engagement
- **Label**: "Aktual"

### Data Estimasi

- **Sumber**: Perhitungan berdasarkan data yang tersedia
- **Akurasi**: Tidak 100% (estimasi)
- **Fields**: engagement_rate (jika reach tidak tersedia)
- **Label**: "Dihitung Sistem" atau "Estimasi"

### Data Demo

- **Sumber**: Data dummy untuk development
- **Akurasi**: Tidak ada (contoh)
- **Label**: "Demo"

## Troubleshooting

### Error: META_ACCESS_TOKEN belum diisi

**Solusi**: Pastikan `META_ACCESS_TOKEN` sudah diisi di Netlify Environment Variables

### Error: Izin Instagram tidak tersedia

**Solusi**: 
1. Pastikan token memiliki permission `instagram_basic` dan `instagram_manage_comments`
2. Generate ulang token dengan permission yang benar
3. Update environment variable

### Error: Instagram Business Account ID tidak valid

**Solusi**:
1. Pastikan ID benar (format numeric, 15+ digit)
2. Pastikan akun sudah dikonversi ke Instagram Business
3. Pastikan akun terhubung ke Facebook Page

### Error: Token sudah kedaluwarsa

**Solusi**: Generate ulang access token dan update environment variable

### Error: Postingan belum memiliki komentar

**Solusi**: Ini bukan error, postingan memang belum ada komentar. Pilih postingan lain yang memiliki komentar.

### Error: Komentar dinonaktifkan

**Solusi**: Pastikan komentar tidak dinonaktifkan di setting Instagram Business Account

## Support

Untuk bantuan lebih lanjut:
- Meta Developers Documentation: https://developers.facebook.com/docs/
- Instagram Graph API Reference: https://developers.facebook.com/docs/instagram-api/
