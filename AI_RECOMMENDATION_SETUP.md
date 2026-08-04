# AI Recommendation Setup Guide

## Overview

Fitur AI Recommendation pada halaman Analisis Sentimen KokoroLens menggunakan Google Gemini API untuk menghasilkan rekomendasi berbasis data hasil analisis sentimen. Fitur ini bekerja sebagai Decision Support System untuk membantu tim digital marketing dalam membuat keputusan strategis.

## Architecture

```
Frontend KokoroLens
→ Netlify Function (gemini-recommendation.js)
→ Gemini API
→ Netlify Function
→ Frontend KokoroLens
```

## Security Principles

- **API Key hanya di backend**: Gemini API Key disimpan di Netlify Environment Variables, tidak pernah di frontend
- **Tidak ada penyimpanan lokal**: API Key tidak disimpan di localStorage, sessionStorage, atau file frontend
- **Request validation**: Backend memvalidasi semua request sebelum mengirim ke Gemini
- **Output sanitization**: Semua output dari AI disanitasi sebelum ditampilkan untuk mencegah XSS
- **Rate limiting**: Request timeout 30 detik untuk mencegah abuse

## Setup Instructions

### 1. Mendapatkan Gemini API Key

1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan Google account Anda
3. Klik "Create API Key"
4. Copy API Key yang dihasilkan
5. **PENTING**: Jangan bagikan API Key ini atau commit ke repository

### 2. Menambahkan GEMINI_API_KEY ke Netlify

#### Via Netlify Dashboard (Production):

1. Buka [Netlify Dashboard](https://app.netlify.com)
2. Pilih site KokoroLens
3. Masuk ke **Site configuration** → **Environment variables**
4. Klik **Add a variable**
5. Masukkan:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Paste API Key Gemini Anda
6. Klik **Save**
7. Trigger redeploy (otomatis atau manual)

#### Via Netlify CLI (Development):

```bash
netlify env:set GEMINI_API_KEY "your-api-key-here"
netlify deploy
```

### 3. Melakukan Redeploy

Setelah menambahkan environment variable:

1. Netlify akan otomatis redeploy
2. Atau trigger manual redeploy dari dashboard
3. Tunggu deployment selesai
4. Fitur AI Recommendation akan aktif

## File Structure

### Files Created:
- `netlify/functions/gemini-recommendation.js` - Netlify Function untuk memanggil Gemini API
- `AI_RECOMMENDATION_SETUP.md` - Dokumentasi ini

### Files Modified:
- `index.html` - Update UI dan JavaScript untuk AI Recommendation
- `.env.example` - Tambahkan GEMINI_API_KEY placeholder

## Request Format

Frontend mengirim data ringkasan ke Netlify Function:

```json
{
  "analysis_id": "ANALYSIS_1234567890",
  "total_comments": 100,
  "sentiment_distribution": {
    "positive": 55,
    "neutral": 30,
    "negative": 15
  },
  "sentiment_percentage": {
    "positive": 55.0,
    "neutral": 30.0,
    "negative": 15.0
  },
  "average_confidence": 0.87,
  "low_confidence_count": 8,
  "top_positive_words": [
    {"word": "bagus", "count": 20},
    {"word": "membantu", "count": 15}
  ],
  "top_negative_words": [
    {"word": "lama", "count": 12},
    {"word": "bingung", "count": 8}
  ],
  "top_neutral_words": [],
  "dominant_topics": [
    {"topic": "pendaftaran magang", "count": 25},
    {"topic": "syarat peserta", "count": 18}
  ],
  "negative_examples": [
    {"text": "Admin lama membalas", "confidence": 0.91}
  ],
  "positive_examples": [
    {"text": "Informasinya sangat membantu", "confidence": 0.94}
  ],
  "model_info": {
    "algorithm": "Multinomial Naive Bayes",
    "feature_extraction": "TF-IDF",
    "model_version": "1.0.0"
  }
}
```

## Response Format

Netlify Function mengembalikan rekomendasi dari Gemini:

```json
{
  "summary": "Ringkasan kondisi sentimen akun secara keseluruhan",
  "dominant_sentiment": "positif/netral/negatif",
  "main_findings": [
    {
      "finding": "Temuan utama",
      "evidence": "Dasar data dari temuan tersebut"
    }
  ],
  "negative_issues": [
    {
      "issue": "Masalah utama dari sentimen negatif",
      "evidence": "Dasar data dari masalah tersebut",
      "priority": "tinggi/sedang/rendah"
    }
  ],
  "positive_drivers": [
    {
      "factor": "Faktor utama penyebab sentimen positif",
      "evidence": "Dasar data dari faktor tersebut"
    }
  ],
  "recommendations": [
    {
      "title": "Judul rekomendasi",
      "description": "Deskripsi rekomendasi",
      "evidence": "Dasar data dari rekomendasi",
      "priority": "tinggi/sedang/rendah",
      "category": "strategi konten/pelayanan/respon admin/informasi/evaluasi data"
    }
  ],
  "limitations": [
    "Keterbatasan analisis"
  ]
}
```

## Error Handling

Backend menangani error berikut:

1. **API Key not configured**: "Gemini API Key belum dikonfigurasi oleh administrator"
2. **Quota exceeded**: "Kuota Gemini API telah mencapai batas"
3. **Request timeout**: "Request timeout. Silakan coba lagi"
4. **Validation failed**: "Data analisis tidak valid"
5. **Invalid response**: "Invalid response from Gemini"

Frontend menampilkan pesan error yang user-friendly tanpa menampilkan error teknis mentah.

## Testing the Feature

### Manual Testing:

1. Upload dataset CSV/Excel ke halaman Analisis Sentimen
2. Klik "Analisis Dataset"
3. Tunggu proses klasifikasi selesai
4. Scroll ke bagian "AI Insight & Recommendation"
5. Klik "Generate Rekomendasi AI"
6. Tunggu rekomendasi dihasilkan
7. Verifikasi hasil ditampilkan dengan benar

### Testing Scenarios:

1. ✅ API Key tersedia dan valid
2. ❌ API Key tidak tersedia (belum dikonfigurasi)
3. ❌ API Key tidak valid
4. ❌ Kuota habis
5. ❌ Data analisis kosong
6. ✅ Data sentimen lengkap
7. ✅ Hanya satu kelas sentimen
8. ✅ Response Gemini valid
9. ❌ Response Gemini bukan JSON
10. ❌ Request terlalu besar
11. ✅ Tombol dipencet dua kali (disabled state)
12. ✅ Output mengandung HTML atau script (sanitization)
13. ✅ Rekomendasi disimpan ke riwayat (jika ada)
14. ✅ Export menyertakan rekomendasi

## Limitations

- Rekomendasi berbasis data ringkasan, bukan seluruh dataset
- AI tidak melakukan klasifikasi sentimen (tetap menggunakan TF-IDF + Naive Bayes)
- Rekomendasi memerlukan validasi manusia sebelum diterapkan
- Kuota Gemini API terbatas (gratis tier: 60 requests/day)
- Response time tergantung koneksi internet dan load Gemini API

## Academic Integrity

Untuk penelitian akademis:

- **Metode utama**: TF-IDF + Multinomial Naive Bayes
- **Gemini AI**: Decision Support System / AI-assisted Recommendation
- **Evaluasi model**: Accuracy, Precision, Recall, F1-score berasal dari Naive Bayes
- **Jangan menyatakan**: Gemini melakukan klasifikasi sentimen
- **Jangan menggunakan**: Rekomendasi AI untuk menghitung metrik evaluasi

## Troubleshooting

### Error: "Gemini API Key belum dikonfigurasi"

**Solusi**:
- Pastikan GEMINI_API_KEY ditambahkan ke Netlify Environment Variables
- Trigger redeploy setelah menambahkan environment variable
- Cek spelling: GEMINI_API_KEY (case-sensitive)

### Error: "Kuota Gemini API telah mencapai batas"

**Solusi**:
- Tunggu reset kuota (gratis tier reset harian)
- Upgrade ke paid tier untuk kuota lebih tinggi
- Kurangi penggunaan fitur AI Recommendation

### Error: "Data analisis tidak valid"

**Solusi**:
- Pastikan dataset sudah dianalisis sebelum generate rekomendasi
- Cek apakah dataset memiliki komentar yang valid
- Verifikasi preprocessing berhasil

### Rekomendasi tidak muncul

**Solusi**:
- Cek console browser untuk error
- Verifikasi Netlify Function berhasil deploy
- Test endpoint Netlify Function secara manual
- Cek Gemini API status di Google Cloud Console

## Monitoring

Untuk memantau penggunaan Gemini API:

1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Lihat usage statistics untuk API Key Anda
3. Monitor request count dan error rate

## Cost Considerations

- **Free tier**: 60 requests/day untuk gemini-pro
- **Paid tier**: $0.001 per 1K characters untuk gemini-pro
- Setiap request kira-kira 2-3K characters (prompt + response)
- Estimasi biaya: $0.002-0.003 per request (paid tier)

## Support Untuk masalah atau pertanyaan, hubungi developer atau buka issue di GitHub repository.
