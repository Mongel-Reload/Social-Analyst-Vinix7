from flask import Flask, request, jsonify
from flask_cors import CORS
from model import SentimentClassifier
import os

app = Flask(__name__)
CORS(app)

# Initialize classifier
classifier = SentimentClassifier()
model_path = 'backend/models/sentiment_model.joblib'

# Load model if it exists
if os.path.exists(model_path):
    try:
        classifier.load_model(model_path)
        print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    """Predict sentiment for a single text with linguistic features"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field in request body'}), 400
        
        text = data['text']
        
        if not text or not isinstance(text, str):
            return jsonify({'error': 'Text must be a non-empty string'}), 400
        
        if classifier.classifier is None:
            return jsonify({'error': 'Model not trained. Please train the model first.'}), 400
        
        result = classifier.predict(text)
        
        return jsonify({
            'ok': True,
            'result': result
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    """Predict sentiment for multiple texts with linguistic features"""
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing "texts" field in request body'}), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list):
            return jsonify({'error': 'Texts must be a list of strings'}), 400
        
        if not texts:
            return jsonify({'error': 'Texts list cannot be empty'}), 400
        
        if classifier.classifier is None:
            return jsonify({'error': 'Model not trained. Please train the model first.'}), 400
        
        results = classifier.predict_batch(texts)
        
        return jsonify({
            'ok': True,
            'results': results,
            'total': len(results)
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train():
    """Train the sentiment classifier"""
    try:
        data = request.get_json()
        
        if not data or 'dataset_path' not in data:
            return jsonify({'error': 'Missing "dataset_path" field in request body'}), 400
        
        dataset_path = data['dataset_path']
        test_size = data.get('test_size', 0.2)
        random_state = data.get('random_state', 42)
        
        if not os.path.exists(dataset_path):
            return jsonify({'error': f'Dataset file not found: {dataset_path}'}), 400
        
        # Train model
        metrics = classifier.train(dataset_path, test_size=test_size, random_state=random_state)
        
        # Save model
        classifier.save_model(model_path)
        
        return jsonify({
            'ok': True,
            'message': 'Model trained and saved successfully',
            'metrics': metrics
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/metrics', methods=['GET'])
def metrics():
    """Get model evaluation metrics"""
    try:
        if classifier.pipeline is None:
            return jsonify({'ok': False, 'error': 'Model not trained'}), 400
        
        return jsonify({
            'ok': True,
            'metrics': classifier.metrics
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        info = classifier.get_model_info()
        
        return jsonify({
            'ok': True,
            'info': info
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'ok': True,
        'status': 'healthy',
        'model_loaded': classifier.classifier is not None,
        'features': 'TF-IDF + Linguistic Features'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
