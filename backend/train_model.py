from model import SentimentClassifier

def main():
    classifier = SentimentClassifier()
    
    print("=== Training Sentiment Classifier ===")
    print("Loading dataset...")
    
    # Train model
    dataset_path = 'backend/data/dataset.csv'
    metrics = classifier.train(dataset_path, test_size=0.2, random_state=42)
    
    print("\n=== Training Complete ===")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1-Score: {metrics['f1_score']:.4f}")
    print("\nConfusion Matrix:")
    print(metrics['confusion_matrix'])
    print("\nClassification Report:")
    print(metrics['classification_report'])
    
    # Save model
    classifier.save_model()
    print("\nModel saved to backend/models/sentiment_model.joblib")

if __name__ == '__main__':
    main()
