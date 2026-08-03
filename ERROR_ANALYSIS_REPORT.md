# Error Analysis Report (False Positive dan False Negative)

## Informasi Pengujian

| Parameter | Nilai |
|-----------|-------|
| Tanggal Pengujian | - |
| Model Version | v1.0 |
| Dataset Testing | backend/data/dataset.csv (test set) |
| Total Data Testing | - |
| Total Salah Klasifikasi | - |
| Tingkat Kesalahan | -% |

## Ringkasan False Positive dan False Negative

### Per-Class Summary (One-vs-Rest)

| Kelas | True Positive | True Negative | False Positive | False Negative | Precision | Recall | F1-Score |
|-------|---------------|---------------|----------------|----------------|-----------|--------|----------|
| Positif | - | - | - | - | - | - | - |
| Netral | - | - | - | - | - | - | - |
| Negatif | - | - | - | - | - | - | - |

## Detail Kesalahan Klasifikasi

### Jenis Kesalahan

| Jenis Kesalahan | Jumlah | Persentase |
|---------------|--------|------------|
| False Positive Positif | - | -% |
| False Negative Positif | - | -% |
| False Positive Netral | - | -% |
| False Negative Netral | - | -% |
| False Positive Negatif | - | -% |
| False Negative Negatif | - | -% |

### Indikasi Penyebab

| Indikasi Penyebab | Jumlah | Persentase |
|------------------|--------|------------|
| Negasi | - | -% |
| Sarkasme | - | -% |
| Bahasa tidak baku | - | -% |
| Singkatan | - | -% |
| Typo | - | -% |
| Campuran bahasa | - | -% |
| Kata ambigu | - | -% |
| Teks terlalu pendek | - | -% |
| Konteks tidak lengkap | - | -% |
| Lainnya | - | -% |

## Tabel Detail Komentar Salah Klasifikasi

*(Isi setelah pengujian selesai atau import dari misclassified-results.csv)*

| No | Teks Asli | Teks Preprocessing | Label Aktual | Label Prediksi | Confidence | Prob Positif | Prob Netral | Prob Negatif | Jenis Kesalahan | Kelas Evaluasi | Indikasi Penyebab |
|----|-----------|-------------------|--------------|----------------|------------|-------------|------------|-------------|-----------------|---------------|-------------------|
| 1 | - | - | - | - | - | - | - | - | - | - | - |
| 2 | - | - | - | - | - | - | - | - | - | - | - |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Analisis Kesalahan

### Pola Kesalahan
*(Isi setelah pengujian selesai)*

### Kelas Paling Sering Salah
*(Isi setelah pengujian selesai)*

### Rekomendasi Perbaikan
*(Isi setelah pengujian selesai)*

## Cara Menghasilkan Data

### 1. Jalankan Model Testing
Gunakan script berikut untuk menghasilkan data salah klasifikasi:

```python
from model import SentimentClassifier
import pandas as pd

classifier = SentimentClassifier()
classifier.load_model()

# Load test dataset
df = pd.read_csv('backend/data/dataset.csv')

# Preprocess
df = classifier.preprocess_data(df)

# Split test set (gunakan random_state yang sama dengan training)
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    df['processed_text'],
    df['label'],
    test_size=0.2,
    random_state=42,
    stratify=df['label']
)

# Predict
y_pred = classifier.pipeline.predict(X_test)
y_proba = classifier.pipeline.predict_proba(X_test)

# Identify misclassified
misclassified = []
for i, (actual, pred) in enumerate(zip(y_test, y_pred)):
    if actual != pred:
        misclassified.append({
            'no': i + 1,
            'text_asli': df.iloc[X_test.index[i]]['text'],
            'text_preprocessing': X_test.iloc[i],
            'label_aktual': classifier.label_decoder[actual],
            'label_prediksi': classifier.label_decoder[pred],
            'confidence': float(y_proba[i][pred]),
            'prob_positif': float(y_proba[i][0]),
            'prob_netral': float(y_proba[i][1]),
            'prob_negatif': float(y_proba[i][2])
        })

# Save to CSV
pd.DataFrame(misclassified).to_csv('misclassified-results.csv', index=False)
```

### 2. Analisis Manual
Untuk setiap komentar salah klasifikasi:
1. Baca teks asli
2. Identifikasi jenis kesalahan (FP/FN untuk setiap kelas)
3. Tentukan indikasi penyebab
4. Catat di kolom yang sesuai

### 3. Update Report
Setelah analisis manual selesai:
1. Update ringkasan FP/FN
2. Update indikasi penyebab
3. Import data ke tabel detail
4. Tambahkan analisis kesalahan

## Catatan Pengujian

### Environment
- **Python Version**: -
- **scikit-learn Version**: -
- **pandas Version**: -

### Waktu Pengujian
- **Start Time**: -
- **End Time**: -
- **Duration**: -

### Validasi Data
- [ ] Label hanya positif, netral, negatif
- [ ] Confidence antara 0 dan 1
- [ ] Probabilitas berjumlah mendekati 1
- [ ] Data testing tidak bocor ke training
- [ ] Model yang diuji sama dengan model produksi

Jangan mengisi hasil palsu atau perkiraan.
