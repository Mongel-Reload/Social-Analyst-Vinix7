# KokoroLens Social Intelligence — Netlify Ready

Project ini sudah disiapkan agar bisa di-upload ke GitHub lalu di-deploy ke Netlify.

## Isi Folder

- `index.html` — frontend dashboard KokoroLens
- `assets/kokorolens-logo.png` — logo
- `netlify.toml` — konfigurasi Netlify
- `package.json` — dependency untuk Netlify Functions
- `netlify/functions/` — backend serverless untuk Meta Graph API
- `.env.example` — contoh environment variables

## Cara Upload ke GitHub

1. Buat repository baru di GitHub.
2. Upload semua file/folder dari ZIP ini ke repository.
3. Jangan upload file `.env` asli.

## Cara Deploy ke Netlify

1. Login ke Netlify.
2. Pilih **Add new site**.
3. Pilih **Import an existing project**.
4. Hubungkan repository GitHub.
5. Build settings:
   - Build command: kosongkan atau isi `npm install`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
6. Deploy.

## Environment Variables di Netlify

Masuk ke:

`Site configuration > Environment variables`

Tambahkan:

```env
# Meta Graph API
META_ACCESS_TOKEN=<your_meta_access_token>
META_PAGE_ID=<your_page_id>
META_IG_ID=<your_instagram_business_id>
META_API_VERSION=v21.0

# AI Recommendation (Sylor API)
OPENAI_BASE_URL=https://api.sylorapi.com
OPENAI_API_KEY=<your_sylor_api_key>
OPENAI_MODEL=<your_sylor_model>

# ML Backend (jika menggunakan Python backend)
ML_BACKEND_URL=<your_ml_backend_url>
```

Setelah itu klik **Redeploy**.

## Endpoint Backend

Website akan memanggil endpoint berikut:

### Meta Graph API
- `/.netlify/functions/meta-test`
- `/.netlify/functions/meta-dashboard`
- `/.netlify/functions/meta-media`
- `/.netlify/functions/meta-comments?media_id=MEDIA_ID`

### Machine Learning & AI Recommendation
- `/.netlify/functions/ml-predict` - Prediksi sentimen dengan TF-IDF + Naive Bayes
- `/.netlify/functions/analysis-summary` - Ringkasan hasil ML
- `/.netlify/functions/ai-recommendation` - Rekomendasi AI dari Sylor API
- `/.netlify/functions/ai-health` - Health check AI

## Catatan Penting

1. Jangan menaruh `META_ACCESS_TOKEN` atau `OPENAI_API_KEY` langsung di HTML.
2. Token harus disimpan di Netlify Environment Variables.
3. Jika tombol Meta API gagal, cek:
   - token valid atau tidak;
   - izin token;
   - Page ID dan Instagram Business ID benar;
   - akun Instagram sudah Business/Creator dan terhubung ke Facebook Page.
4. Field insight Meta bisa berbeda tergantung permission/token yang aktif.
5. Versi ini sudah siap untuk GitHub + Netlify, tetapi masih memakai beberapa data demo untuk halaman non-Meta. Data demo dapat diganti bertahap dari response API.
6. **Analisis Sentimen**: Menggunakan TF-IDF + Multinomial Naive Bayes + Linguistic Features. AI Recommendation hanya untuk rekomendasi strategis, bukan klasifikasi sentimen.
7. **Dataset CSV**: Untuk analisis sentimen, upload CSV dengan kolom `tanggal_upload`, `username`, `komentar`.

## Permission Meta yang Umumnya Dibutuhkan

Tergantung endpoint yang digunakan, biasanya perlu permission seperti:

- `pages_show_list`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_manage_insights`
- `instagram_manage_comments`

Pastikan app dan token Anda memiliki izin yang sesuai.
