# Machine Learning Backend - Sentiment Analysis

Backend Python untuk klasifikasi sentimen menggunakan TF-IDF dan Multinomial Naive Bayes.

## Struktur Folder

```
backend/
├── app.py              # Flask API server
├── model.py            # Model training dan prediction
├── preprocessing.py     # Text preprocessing bahasa Indonesia
├── requirements.txt    # Python dependencies
├── data/
│   └── dataset.csv     # Dataset training
└── models/
    └── sentiment_model.joblib  # Trained model (generated)
```

## Dependencies

- Flask 2.3.3
- Flask-CORS 4.0.0
- scikit-learn 1.3.2
- pandas 2.1.3
- numpy 1.26.2
- joblib 1.3.2
- Sastrawi 1.0.0

## Cara Menjalankan Backend

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Training Model

```bash
python train_model.py
```

Atau gunakan API endpoint:

```bash
curl -X POST http://localhost:5000/train \
  -H "Content-Type: application/json" \
  -d '{"dataset_path": "backend/data/dataset.csv", "test_size": 0.2, "random_state": 42}'
```

### 3. Jalankan Flask Server

```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### POST /predict
Prediksi sentimen untuk satu teks.

**Request:**
```json
{
  "text": "produk ini sangat bagus dan berkualitas"
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "label": "positif",
    "confidence": 0.92,
    "prob_positif": 0.92,
    "prob_netral": 0.05,
    "prob_negatif": 0.03
  }
}
```

### POST /predict-batch
Prediksi sentimen untuk multiple teks.

**Request:**
```json
{
  "texts": ["produk bagus", "layanan buruk", "kualitas standar"]
}
```

**Response:**
```json
{
  "ok": true,
  "results": [...],
  "total": 3
}
```

### POST /train
Training model dengan dataset.

**Request:**
```json
{
  "dataset_path": "backend/data/dataset.csv",
  "test_size": 0.2,
  "random_state": 42
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Model trained and saved successfully",
  "metrics": {
    "accuracy": 0.92,
    "precision": 0.91,
    "recall": 0.90,
    "f1_score": 0.90,
    "confusion_matrix": [[...]],
    "classification_report": "..."
  }
}
```

### GET /metrics
Get metrics model yang sudah di-train.

**Response:**
```json
{
  "ok": true,
  "metrics": {...}
}
```

### GET /model-info
Get informasi model.

**Response:**
```json
{
  "ok": true,
  "info": {
    "status": "trained",
    "label_encoder": {...},
    "label_decoder": {...},
    "metrics": {...}
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "status": "healthy",
  "model_loaded": true
}
```

## Text Preprocessing

Preprocessing dilakukan dengan langkah:

1. **Case Folding** - Konversi ke lowercase
2. **Remove URL** - Hapus URL dan link
3. **Remove Mention** - Hapus @username
4. **Remove Hashtag Symbol** - Hapus # tapi keep text
5. **Remove Emoji** - Hapus emoji
6. **Remove Numbers** - Hapus angka
7. **Remove Punctuation** - Hapus tanda baca
8. **Tokenization** - Pecah teks menjadi kata
9. **Stopword Removal** - Hapus kata umum bahasa Indonesia
10. **Stemming** - Konversi ke kata dasar (Sastrawi)

## Model

- **Algorithm**: Multinomial Naive Bayes
- **Feature Extraction**: TF-IDF Vectorizer
- **Max Features**: 5000
- **N-gram Range**: (1, 2)
- **Alpha**: 0.1 (Laplace smoothing)

## Dataset Format

Dataset harus berupa CSV dengan kolom:

```csv
text,sentiment
produk ini sangat bagus,positif
layanan sangat mengecewakan,negatif
kualitas biasa saja,netral
```

Label sentiment: `positif`, `netral`, `negatif` (case insensitive)

## Evaluasi Model

Metrics yang dihitung:

- Accuracy
- Precision (weighted)
- Recall (weighted)
- F1-score (weighted)
- Confusion Matrix
- Classification Report

## Cara Menghubungkan ke Frontend

1. Set environment variable `ML_BACKEND_URL` di Netlify
2. Netlify function `ml-predict.js` akan proxy request ke backend
3. Frontend memanggil `/.netlify/functions/ml-predict`

## Troubleshooting

### Model tidak ter-load
Pastikan file `backend/models/sentiment_model.joblib` ada. Training model terlebih dahulu.

### Error Saat Predict
Pastikan Flask server berjalan dan ML_BACKEND_URL sudah di-set di environment variables.

### Dataset tidak ditemukan
Pastikan path dataset benar dan file CSV ada.
