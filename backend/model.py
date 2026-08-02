import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import os
from preprocessing import TextPreprocessor

class SentimentClassifier:
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.pipeline = None
        self.label_encoder = {'positif': 0, 'netral': 1, 'negatif': 2}
        self.label_decoder = {0: 'positif', 1: 'netral', 2: 'negatif'}
        self.metrics = {}
        
    def create_pipeline(self):
        """Create ML pipeline with TF-IDF and MultinomialNB"""
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.8
            )),
            ('classifier', MultinomialNB(alpha=0.1))
        ])
        return self.pipeline
    
    def load_data(self, dataset_path):
        """Load dataset from CSV file"""
        try:
            df = pd.read_csv(dataset_path)
            
            # Ensure required columns exist
            required_columns = ['text', 'sentiment']
            for col in required_columns:
                if col not in df.columns:
                    raise ValueError(f"Column '{col}' not found in dataset")
            
            # Map sentiment labels to standard format
            df['sentiment'] = df['sentiment'].str.lower().str.strip()
            df['label'] = df['sentiment'].map(self.label_encoder)
            
            # Remove rows with missing labels
            df = df.dropna(subset=['label'])
            
            return df
        except Exception as e:
            raise ValueError(f"Error loading dataset: {str(e)}")
    
    def preprocess_data(self, df):
        """Preprocess text data"""
        df['processed_text'] = df['text'].apply(self.preprocessor.preprocess)
        return df
    
    def train(self, dataset_path, test_size=0.2, random_state=42):
        """Train the sentiment classifier"""
        # Load and preprocess data
        df = self.load_data(dataset_path)
        df = self.preprocess_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            df['processed_text'],
            df['label'],
            test_size=test_size,
            random_state=random_state,
            stratify=df['label']
        )
        
        # Create and train pipeline
        self.create_pipeline()
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.pipeline.predict(X_test)
        
        # Calculate metrics
        self.metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1_score': f1_score(y_test, y_pred, average='weighted'),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'classification_report': classification_report(y_test, y_pred, target_names=list(self.label_decoder.values()))
        }
        
        return self.metrics
    
    def predict(self, text):
        """Predict sentiment for a single text"""
        if self.pipeline is None:
            raise ValueError("Model not trained. Please train the model first.")
        
        # Preprocess text
        processed_text = self.preprocessor.preprocess(text)
        
        # Predict
        label_encoded = self.pipeline.predict([processed_text])[0]
        probabilities = self.pipeline.predict_proba([processed_text])[0]
        
        # Get label and confidence
        label = self.label_decoder[label_encoded]
        confidence = float(probabilities[label_encoded])
        
        # Get all probabilities
        prob_positif = float(probabilities[0])
        prob_netral = float(probabilities[1])
        prob_negatif = float(probabilities[2])
        
        return {
            'label': label,
            'confidence': confidence,
            'prob_positif': prob_positif,
            'prob_netral': prob_netral,
            'prob_negatif': prob_negatif
        }
    
    def predict_batch(self, texts):
        """Predict sentiment for multiple texts"""
        if self.pipeline is None:
            raise ValueError("Model not trained. Please train the model first.")
        
        results = []
        for text in texts:
            result = self.predict(text)
            result['text'] = text
            results.append(result)
        
        return results
    
    def save_model(self, model_path='backend/models/sentiment_model.joblib'):
        """Save trained model to disk"""
        if self.pipeline is None:
            raise ValueError("No model to save. Please train the model first.")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save pipeline and metrics
        model_data = {
            'pipeline': self.pipeline,
            'label_encoder': self.label_encoder,
            'label_decoder': self.label_decoder,
            'metrics': self.metrics
        }
        
        joblib.dump(model_data, model_path)
        print(f"Model saved to {model_path}")
    
    def load_model(self, model_path='backend/models/sentiment_model.joblib'):
        """Load trained model from disk"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        
        model_data = joblib.load(model_path)
        self.pipeline = model_data['pipeline']
        self.label_encoder = model_data['label_encoder']
        self.label_decoder = model_data['label_decoder']
        self.metrics = model_data.get('metrics', {})
        
        print(f"Model loaded from {model_path}")
    
    def get_model_info(self):
        """Get model information"""
        if self.pipeline is None:
            return {'status': 'not_trained'}
        
        return {
            'status': 'trained',
            'label_encoder': self.label_encoder,
            'label_decoder': self.label_decoder,
            'metrics': self.metrics
        }
