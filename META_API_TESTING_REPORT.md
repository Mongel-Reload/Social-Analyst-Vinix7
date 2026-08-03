# Meta API Testing Report

Laporan pengujian integrasi Meta Graph API dengan aplikasi Social Analyst Vinix7.

## Ringkasan

| Endpoint | Status | Catatan |
|----------|--------|---------|
| meta-test | ⏳ Belum diuji | - |
| meta-media | ⏳ Belum diuji | - |
| meta-comments | ⏳ Belum diuji | - |
| Integrasi Naive Bayes | ⏳ Belum diuji | - |

## Skenario Pengujian

### 1. Token Valid

**Endpoint**: `meta-test`
**Input**: Environment variables terisi dengan token valid
**Hasil yang Diharapkan**: Response dengan `success: true`, menampilkan data page dan instagram
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 2. Token Tidak Valid

**Endpoint**: `meta-test`
**Input**: `META_ACCESS_TOKEN` diisi dengan token tidak valid
**Hasil yang Diharapkan**: Response dengan `success: false`, error type `META_CREDENTIAL_ERROR`
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 3. Token Kedaluwarsa

**Endpoint**: `meta-test`
**Input**: `META_ACCESS_TOKEN` diisi dengan token yang sudah expired
**Hasil yang Diharapkan**: Response dengan `success: false`, error type `META_TOKEN_EXPIRED`
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 4. Instagram Business Account Valid

**Endpoint**: `meta-test`
**Input**: `META_IG_ID` diisi dengan ID Instagram Business valid
**Hasil yang Diharapkan**: Response dengan `success: true`, menampilkan data instagram (username, followers, media_count)
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 5. Akun Instagram Belum Terhubung

**Endpoint**: `meta-test`
**Input**: `META_IG_ID` diisi dengan ID yang tidak terhubung ke Facebook Page
**Hasil yang Diharapkan**: Response dengan `success: false`, error type `META_IG_ERROR`
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 6. Daftar Media Berhasil

**Endpoint**: `meta-media`
**Input**: `limit=25`
**Hasil yang Diharapkan**: Response dengan `success: true`, array media dengan field lengkap
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 7. Media Kosong

**Endpoint**: `meta-media`
**Input**: Akun Instagram tanpa postingan
**Hasil yang Diharapkan**: Response dengan `success: true`, array media kosong
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 8. Pagination Media

**Endpoint**: `meta-media`
**Input**: `limit=10`, `after={cursor}`
**Hasil yang Diharapkan**: Response dengan `success: true`, `paging.has_next: true`, `paging.after` terisi
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 9. Komentar Berhasil

**Endpoint**: `meta-comments`
**Input**: `media_id={valid_media_id}`
**Hasil yang Diharapkan**: Response dengan `success: true`, array komentar dengan field lengkap
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 10. Komentar Kosong

**Endpoint**: `meta-comments`
**Input**: `media_id={media_without_comments}`
**Hasil yang Diharapkan**: Response dengan `success: true`, array komentar kosong, message "Postingan ini belum memiliki komentar."
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 11. Permission Komentar Tidak Tersedia

**Endpoint**: `meta-comments`
**Input**: Token tanpa permission `instagram_manage_comments`
**Hasil yang Diharapkan**: Response dengan `success: false`, error type `META_PERMISSION_ERROR`
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 12. Media ID Tidak Valid

**Endpoint**: `meta-comments`
**Input**: `media_id={invalid_id}`
**Hasil yang Diharapkan**: Response dengan `success: false`, error type `META_MEDIA_NOT_FOUND`
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 13. Pagination Komentar

**Endpoint**: `meta-comments`
**Input**: `media_id={media_with_many_comments}`, `limit=10`, `after={cursor}`
**Hasil yang Diharapkan**: Response dengan `success: true`, `paging.has_next: true`, `paging.after` terisi
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 14. Prediksi Batch Berhasil

**Endpoint**: `ml-predict` (via Netlify function)
**Input**: Array komentar dari Meta API
**Hasil yang Diharapkan**: Response dengan `ok: true`, array results dengan label, confidence, probabilities
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 15. Backend Machine Learning Gagal

**Endpoint**: `ml-predict` (via Netlify function)
**Input**: Array komentar, ML backend tidak berjalan
**Hasil yang Diharapkan**: Frontend menampilkan komentar tanpa label sentimen, confidence "(ML Error)"
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 16. Komentar Mengandung HTML atau Script

**Endpoint**: `meta-comments` + Frontend
**Input**: Komentar dengan tag HTML atau script
**Hasil yang Diharapkan**: Komentar ditampilkan sebagai text (bukan HTML), tidak dieksekusi
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

### 17. Rate Limit Meta API

**Endpoint**: `meta-media` atau `meta-comments`
**Input**: Banyak request dalam waktu singkat
**Hasil yang Diharapkan**: Response dengan error rate limit yang jelas
**Hasil Aktual**: ⏳ Belum diuji
**Status**: ⏳ Pending
**Catatan**: -

## Checklist Integrasi

### Backend Netlify Functions

- [ ] `meta-test.js` - Test koneksi Meta API
- [ ] `meta-media.js` - Ambil daftar postingan
- [ ] `meta-comments.js` - Ambil komentar postingan
- [ ] `_meta.js` - Utility functions
- [ ] Error handling untuk setiap error type
- [ ] Response structure konsisten

### Frontend

- [ ] Halaman Meta API menampilkan status koneksi
- [ ] Menampilkan info akun (Page dan Instagram)
- [ ] Daftar postingan dengan thumbnail dan info
- [ ] Tombol "Analisis Komentar" per postingan
- [ ] Integrasi dengan halaman Sentimen
- [ ] Loading state yang jelas
- [ ] Error message yang user-friendly

### Integrasi ML Model

- [ ] Kirim komentar ke ML backend
- [ ] Terima hasil prediksi (label, confidence, probabilities)
- [ ] Tampilkan hasil di tabel
- [ ] Fallback jika ML gagal
- [ ] Badge sumber data (Meta Graph API)

### Data Handling

- [ ] Tidak ada data dummy/simulasi
- [ ] Data dari API berlabel "Aktual"
- [ ] Data kosong berlabel "Belum Tersedia"
- [ ] Sanitasi input komentar (XSS protection)

## Catatan Pengujian

### Environment

- **Tanggal**: -
- **Tester**: -
- **Environment**: Development / Production
- **Meta API Version**: v21.0

### Hasil Pengujian

*(Isi setelah pengujian selesai)*

### Masalah yang Ditemukan

*(Isi setelah pengujian selesai)*

### Rekomendasi Perbaikan

*(Isi setelah pengujian selesai)*

---

## Cara Mengisi Report

1. Jalankan setiap skenario pengujian
2. Isi "Hasil Aktual" dengan response yang diterima
3. Isi "Status" dengan:
   - ✅ Berhasil
   - ❌ Gagal
   - ⏳ Pending
4. Tambahkan catatan jika diperlukan
5. Update ringkasan di bagian atas
