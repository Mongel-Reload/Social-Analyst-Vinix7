# Model Evaluation Report

## Informasi Model

| Parameter | Nilai |
|-----------|-------|
| Versi Model | v1.0 |
| Tanggal Training | - |
| Algoritma | TF-IDF + Multinomial Naive Bayes |
| Bahasa | Indonesia |
| Jumlah Kelas | 3 (Positif, Netral, Negatif) |

## Parameter Model

### TF-IDF Vectorizer
| Parameter | Nilai |
|-----------|-------|
| max_features | 5000 |
| ngram_range | (1, 2) |
| min_df | 2 |
| max_df | 0.8 |

### Multinomial Naive Bayes
| Parameter | Nilai |
|-----------|-------|
| alpha | 0.1 |

## Informasi Dataset

| Parameter | Nilai |
|-----------|-------|
| Path Dataset | backend/data/dataset.csv |
| Total Data | - |
| Jumlah Data Training | - |
| Jumlah Data Testing | - |
| Test Size | 0.2 (20%) |
| Random State | 42 |
| Stratify | Ya |

### Distribusi Kelas Training

| Kelas | Jumlah | Persentase |
|-------|--------|------------|
| Positif | - | -% |
| Netral | - | -% |
| Negatif | - | -% |
| Total | - | 100% |

### Distribusi Kelas Testing

| Kelas | Jumlah | Persentase |
|-------|--------|------------|
| Positif | - | -% |
| Netral | - | -% |
| Negatif | - | -% |
| Total | - | 100% |

## Hasil Evaluasi

### Overall Metrics

| Metric | Nilai |
|--------|-------|
| Accuracy | - |
| Macro Precision | - |
| Macro Recall | - |
| Macro F1-Score | - |
| Weighted Precision | - |
| Weighted Recall | - |
| Weighted F1-Score | - |

### Per-Class Metrics

| Kelas | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| Positif | - | - | - | - |
| Netral | - | - | - | - |
| Negatif | - | - | - | - |

### Classification Report

```
              precision    recall  f1-score   support

    positif       -         -        -         -
     netral       -         -        -         -
    negatif       -         -        -         -

    accuracy                           -         -
   macro avg       -         -        -         -
weighted avg       -         -        -         -
```

## Confusion Matrix

### Nilai Aktual

| Prediksi \ Aktual | Positif | Netral | Negatif | Total Prediksi |
|-------------------|---------|--------|---------|---------------|
| Positif | - | - | - | - |
| Netral | - | - | - | - |
| Negatif | - | - | - | - |
| Total Aktual | - | - | - | - |

### Interpretasi Confusion Matrix

- **Total Benar**: - (-%)
- **Total Salah**: - (-%)
- **Kelas dengan Recall Tertinggi**: -
- **Kelas dengan Recall Terendah**: -
- **Pasangan Kelas Paling Sering Tertukar**: -
- **Jumlah Kesalahan Klasifikasi**: -

### Visualisasi Confusion Matrix

*(Tambahkan gambar confusion matrix setelah pengujian selesai)*

## Analisis Performa

### Kelebihan Model
*(Isi setelah pengujian selesai)*

### Kelemahan Model
*(Isi setelah pengujian selesai)*

### Rekomendasi Perbaikan
*(Isi setelah pengujian selesai)*

## Cara Menjalankan Evaluasi

### 1. Persiapan Dataset
Pastikan dataset tersedia di `backend/data/dataset.csv` dengan format:
- Kolom `text`: Teks komentar
- Kolom `sentiment`: Label sentimen (positif/netral/negatif)

### 2. Training Model
Jalankan perintah:
```bash
cd backend
python train_model.py
```

### 3. Hasil Training
Setelah training selesai, hasil akan ditampilkan:
- Accuracy
- Precision
- Recall
- F1-Score
- Confusion Matrix
- Classification Report

### 4. Simpan Hasil
Model akan disimpan di `backend/models/sentiment_model.joblib`

### 5. Update Report
Salin hasil dari terminal ke bagian "Hasil Evaluasi" dalam report ini.

## Catatan Pengujian

### Environment
- **Python Version**: -
- **scikit-learn Version**: -
- **pandas Version**: -
- **numpy Version**: -
- **joblib Version**: -

### Waktu Training
- **Start Time**: -
- **End Time**: -
- **Duration**: -

### Masalah yang Ditemukan
*(Isi setelah pengujian selesai)*

## Validasi Hasil

Sebelum mengisi hasil, pastikan:
- [ ] Dataset tidak bocor antara training dan testing
- [ ] Stratify digunakan untuk menjaga distribusi kelas
- [ ] Random state tetap (42) untuk reproducibility
- [ ] Preprocessing sama antara training dan testing
- [ ] Model yang diuji sama dengan model yang digunakan di website
- [ ] Label hanya positif, netral, negatif
- [ ] Confidence antara 0 dan 1

Jangan mengisi hasil palsu atau perkiraan.
