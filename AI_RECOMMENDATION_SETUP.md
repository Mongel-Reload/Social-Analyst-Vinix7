# AI Recommendation Setup Guide

## Overview

Fitur AI Recommendation pada halaman Analisis Sentimen KokoroLens menggunakan Sylor API (OpenAI-compatible) untuk menghasilkan rekomendasi berbasis data hasil analisis sentimen. Fitur ini bekerja sebagai Decision Support System untuk membantu tim digital marketing dalam membuat keputusan strategis.

**PENTING**: AI Recommendation TIDAK melakukan klasifikasi sentimen. Klasifikasi sentimen dilakukan sepenuhnya oleh TF-IDF + Multinomial Naive Bayes. AI hanya menganalisis hasil klasifikasi dan memberikan rekomendasi strategis.

## Architecture

```
Frontend KokoroLens
→ Netlify Function (ml-predict.js) - TF-IDF + Naive Bayes
→ Backend Python (Flask)
→ Netlify Function (analysis-summary.js) - Ringkasan ML
→ Netlify Function (ai-recommendation.js) - Sylor API
→ Frontend KokoroLens
```

## Security Principles

- **API Key hanya di backend**: Sylor API Key disimpan di Netlify Environment Variables, tidak pernah di frontend
- **Tidak ada penyimpanan lokal**: API Key tidak disimpan di localStorage, sessionStorage, atau file frontend
- **Request validation**: Backend memvalidasi semua request sebelum mengirim ke Sylor API
- **Output sanitization**: Semua output dari AI disanitasi sebelum ditampilkan untuk mencegah XSS
- **Rate limiting**: Request timeout 30 detik untuk mencegah abuse

## Setup Instructions

### 1. Mendapatkan Sylor API Key

1. Dapatkan API Key dari provider Sylor API Anda
2. **PENTING**: Jangan bagikan API Key ini atau commit ke repository

### 2. Menambahkan Environment Variables ke Netlify

#### Via Netlify Dashboard (Production):

1. Buka [Netlify Dashboard](https://app.netlify.com)
2. Pilih site KokoroLens
3. Masuk ke **Site configuration** → **Environment variables**
4. Klik **Add a variable**
5. Masukkan:
   - **Key**: `OPENAI_BASE_URL`
   - **Value**: `https://api.sylorapi.com`
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Paste API Key Sylor Anda
   - **Key**: `OPENAI_MODEL`
   - **Value**: Model yang ingin digunakan (misal: `gpt-4o-mini`, `gpt-5.6-luna`, dll)
6. Klik **Save**
7. Trigger redeploy (otomatis atau manual)

#### Via Netlify CLI (Development):

```bash
netlify env:set OPENAI_BASE_URL "https://api.sylorapi.com"
netlify env:set OPENAI_API_KEY "your-api-key-here"
netlify env:set OPENAI_MODEL "your-model-name"
netlify deploy
```

### 3. Melakukan Redeploy

Setelah menambahkan environment variable:

1. Netlify akan otomatis redeploy
2. Atau trigger manual redeploy dari dashboard
3. Tunggu deployment selesai
4. Fitur AI Recommendation akan aktif

## File Structure

### Files:
- `netlify/functions/ml-predict.js` - Netlify Function untuk ML prediction (TF-IDF + Naive Bayes)
- `netlify/functions/analysis-summary.js` - Netlify Function untuk ringkasan ML
- `netlify/functions/ai-recommendation.js` - Netlify Function untuk memanggil Sylor API
- `netlify/functions/ai-health.js` - Netlify Function untuk health check AI
- `AI_RECOMMENDATION_SETUP.md` - Dokumentasi ini

### Files Modified:
- `index.html` - Update UI dan JavaScript untuk AI Recommendation
- `backend/preprocessing.py` - Linguistic feature extraction
- `backend/model.py` - TF-IDF + Linguistic Features + Naive Bayes
- `backend/app.py` - Flask API endpoints

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

1. **API Key not configured**: "API Key AI belum dikonfigurasi oleh administrator"
2. **Model not configured**: "OPENAI_MODEL environment variable belum dikonfigurasi"
3. **Quota exceeded**: "Kuota API telah mencapai batas"
4. **Request timeout**: "Request timeout. Silakan coba lagi"
5. **Validation failed**: "Data analisis tidak valid"
6. **Invalid response**: "Invalid response from API"

**PENTING**: Jika AI Recommendation gagal, hasil ML (sentimen dari Naive Bayes) tetap ditampilkan. AI hanya untuk rekomendasi tambahan.

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
- Kuota API tergantung provider
- Response time tergantung koneksi internet dan load API provider

## Academic Integrity

Untuk penelitian akademis:

- **Metode utama**: TF-IDF + Multinomial Naive Bayes + Linguistic Features
- **Sylor AI**: Decision Support System / AI-assisted Recommendation
- **Evaluasi model**: Accuracy, Precision, Recall, F1-score berasal dari Naive Bayes
- **Jangan menyatakan**: AI melakukan klasifikasi sentimen
- **Jangan menggunakan**: Rekomendasi AI untuk menghitung metrik evaluasi
- **Dataset pengguna**: Berisi kolom `tanggal_upload`, `username`, `komentar`
- **Dataset training**: Berisi kolom `text` dan `sentiment`

## Troubleshooting

### Error: "API Key AI belum dikonfigurasi"

**Solusi**:
- Pastikan OPENAI_API_KEY ditambahkan ke Netlify Environment Variables
- Trigger redeploy setelah menambahkan environment variable
- Cek spelling: OPENAI_API_KEY (case-sensitive)

### Error: "OPENAI_MODEL environment variable belum dikonfigurasi"

**Solusi**:
- Pastikan OPENAI_MODEL ditambahkan ke Netlify Environment Variables
- Set ke model yang valid (misal: gpt-4o-mini, gpt-5.6-luna)

### Error: "Kuota API telah mencapai batas"

**Solusi**:
- Tunggu reset kuota sesuai provider
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
- Cek Sylor API status di dashboard provider

## Monitoring

Untuk memantau penggunaan Sylor API:

1. Buka dashboard provider Sylor API Anda
2. Lihat usage statistics untuk API Key Anda
3. Monitor request count dan error rate

## Cost Considerations

Biaya tergantung pada provider Sylor API dan model yang digunakan. Silakan cek pricing dari provider Anda.

## Support Untuk masalah atau pertanyaan, hubungi developer atau buka issue di GitHub repository.
