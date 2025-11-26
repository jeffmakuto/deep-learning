"""
E-Commerce Sales Prediction API
Flask-based REST API for sales prediction using trained ML models
"""

from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime

app = Flask(__name__)

# Load models and preprocessing objects
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')

# Load all models
lr_model = joblib.load(os.path.join(MODEL_DIR, 'linear_regression_model.joblib'))
rf_model = joblib.load(os.path.join(MODEL_DIR, 'random_forest_model.joblib'))
gb_model = joblib.load(os.path.join(MODEL_DIR, 'gradient_boosting_model.joblib'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'feature_scaler.joblib'))

# Load feature information
with open(os.path.join(MODEL_DIR, 'feature_names.json'), 'r') as f:
    feature_names = json.load(f)

with open(os.path.join(MODEL_DIR, 'feature_info.json'), 'r') as f:
    feature_info = json.load(f)

with open(os.path.join(OUTPUT_DIR, 'model_metrics.json'), 'r') as f:
    model_metrics = json.load(f)

MODELS = {
    'linear_regression': lr_model,
    'random_forest': rf_model,
    'gradient_boosting': gb_model
}

print("✓ API initialized successfully!")
print(f"✓ Loaded {len(MODELS)} models")
print(f"✓ Feature count: {len(feature_names)}")


@app.route('/', methods=['GET'])
def home():
    """API home endpoint"""
    return jsonify({
        'message': 'E-Commerce Sales Prediction API',
        'version': '1.0.0',
        'endpoints': {
            '/predict': 'POST - Make sales predictions',
            '/models': 'GET - List available models',
            '/metrics': 'GET - View model performance metrics',
            '/health': 'GET - Check API health'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': len(MODELS),
        'features_count': len(feature_names)
    })


@app.route('/models', methods=['GET'])
def list_models():
    """List available models and their information"""
    return jsonify({
        'available_models': list(MODELS.keys()),
        'best_model': model_metrics.get('best_model', 'random_forest'),
        'feature_count': len(feature_names),
        'required_features': feature_info['numerical_columns'] + feature_info['categorical_columns']
    })


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get model performance metrics"""
    return jsonify(model_metrics)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Make sales predictions
    
    Expected JSON format:
    {
        "model": "random_forest",  // optional, defaults to best model
        "data": [
            {
                "quantity": 2,
                "unit_price": 150.0,
                "discount_percent": 10,
                "category": "Electronics",
                ...
            }
        ]
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({
                'error': 'Invalid request. Expected JSON with "data" field containing prediction samples'
            }), 400
        
        # Get model selection
        model_name = data.get('model', model_metrics.get('best_model', 'random_forest'))
        
        if model_name not in MODELS:
            return jsonify({
                'error': f'Invalid model name. Available models: {list(MODELS.keys())}'
            }), 400
        
        # Convert input data to DataFrame
        input_df = pd.DataFrame(data['data'])
        
        # Validate required features
        missing_features = []
        for feat in feature_names:
            if feat not in input_df.columns:
                missing_features.append(feat)
        
        if missing_features:
            return jsonify({
                'error': 'Missing required features',
                'missing_features': missing_features[:10],  # Show first 10
                'total_missing': len(missing_features)
            }), 400
        
        # Ensure correct feature order
        input_features = input_df[feature_names]
        
        # Scale features
        input_scaled = scaler.transform(input_features)
        
        # Make predictions
        model = MODELS[model_name]
        predictions = model.predict(input_scaled)
        
        # Prepare response
        response = {
            'model_used': model_name,
            'predictions': predictions.tolist(),
            'prediction_count': len(predictions),
            'timestamp': datetime.now().isoformat(),
            'statistics': {
                'mean': float(np.mean(predictions)),
                'median': float(np.median(predictions)),
                'min': float(np.min(predictions)),
                'max': float(np.max(predictions)),
                'std': float(np.std(predictions))
            }
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500


@app.route('/predict/simple', methods=['POST'])
def predict_simple():
    """
    Simplified prediction endpoint for basic transaction data
    
    Expected JSON format:
    {
        "quantity": 2,
        "unit_price": 150.0,
        "discount_percent": 10,
        "category": "Electronics",
        "brand": "BrandA",
        "customer_segment": "Premium",
        "device_type": "Mobile",
        "payment_method": "Credit Card"
    }
    """
    try:
        data = request.get_json()
        
        # This is a simplified endpoint - in production, you'd need
        # to implement full feature engineering pipeline
        # For now, return a helpful message
        
        return jsonify({
            'message': 'Simplified prediction endpoint',
            'note': 'Full feature engineering pipeline required for accurate predictions',
            'recommendation': 'Use the /predict endpoint with complete feature set',
            'received_data': data
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Request processing failed',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("E-COMMERCE SALES PREDICTION API")
    print("="*60)
    print(f"Best Model: {model_metrics.get('best_model', 'N/A')}")
    print(f"Available Endpoints:")
    print("  - GET  /          : API information")
    print("  - GET  /health    : Health check")
    print("  - GET  /models    : List models")
    print("  - GET  /metrics   : Model metrics")
    print("  - POST /predict   : Make predictions")
    print("="*60)
    print("\nStarting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
