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
META_ACCESS_TOKEN=EAABxxxxxxxxxxxxxxxx
META_PAGE_ID=123456789012345
META_IG_ID=17841400000000000
META_API_VERSION=v21.0
```

Setelah itu klik **Redeploy**.

## Endpoint Backend

Website akan memanggil endpoint berikut:

- `/.netlify/functions/meta-test`
- `/.netlify/functions/meta-dashboard`
- `/.netlify/functions/meta-media`
- `/.netlify/functions/meta-comments?media_id=MEDIA_ID`

## Catatan Penting

1. Jangan menaruh `META_ACCESS_TOKEN` langsung di HTML.
2. Token harus disimpan di Netlify Environment Variables.
3. Jika tombol Meta API gagal, cek:
   - token valid atau tidak;
   - izin token;
   - Page ID dan Instagram Business ID benar;
   - akun Instagram sudah Business/Creator dan terhubung ke Facebook Page.
4. Field insight Meta bisa berbeda tergantung permission/token yang aktif.
5. Versi ini sudah siap untuk GitHub + Netlify, tetapi masih memakai beberapa data demo untuk halaman non-Meta. Data demo dapat diganti bertahap dari response API.

## Permission Meta yang Umumnya Dibutuhkan

Tergantung endpoint yang digunakan, biasanya perlu permission seperti:

- `pages_show_list`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_manage_insights`
- `instagram_manage_comments`

Pastikan app dan token Anda memiliki izin yang sesuai.
