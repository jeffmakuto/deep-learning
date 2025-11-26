# E-Commerce Sales Prediction System

A comprehensive data integration and machine learning system for predicting e-commerce sales using multiple data sources.

## Project Overview

This project demonstrates an end-to-end machine learning pipeline for e-commerce sales forecasting, including:
- Multi-source data integration (sales, customers, products, behavior)
- Comprehensive data cleaning and preprocessing
- Exploratory data analysis with visualizations
- Feature engineering for improved model performance
- Multiple ML model training and evaluation
- REST API for production deployment

## Dataset

The project uses synthetic e-commerce data generated to simulate realistic scenarios:

### Data Sources
1. **Sales Data** (15,000 transactions)
   - Transaction details, dates, amounts, quantities
   - Payment methods, order status, shipping info
   - Device types and traffic sources

2. **Customer Data** (1,000 customers)
   - Demographics (age, gender, city)
   - Customer segments (Premium, Regular, Budget)
   - Registration dates and preferences

3. **Product Data** (200 products)
   - Product categories and brands
   - Pricing, costs, and inventory
   - Ratings and reviews

4. **Behavior Data** (20,404 sessions)
   - Browsing patterns and session duration
   - Cart activity and abandoned carts
   - Email engagement metrics

### Data Characteristics
- **Date Range**: 2023-01-01 to 2024-12-31 (2 years)
- **Total Revenue**: $6.9M
- **Order Completion Rate**: 85%
- **Data Quality Issues**: 2-3% missing values, 50 duplicates, ~140 outliers

## Project Structure

```
ecommerce_sales_prediction/
├── data/
│   ├── sales_data.csv              # Transaction records
│   ├── customer_data.csv           # Customer information
│   ├── product_data.csv            # Product catalog
│   └── customer_behavior.csv       # Browsing/engagement data
├── models/
│   ├── linear_regression_model.joblib
│   ├── random_forest_model.joblib
│   ├── gradient_boosting_model.joblib
│   ├── feature_scaler.joblib
│   ├── feature_names.json
│   └── feature_info.json
├── output/
│   ├── integrated_sales_data.csv   # Merged dataset
│   ├── model_ready_data.csv        # With engineered features
│   ├── feature_importance.csv      # Feature rankings
│   ├── model_metrics.json          # Performance metrics
│   ├── eda_visualizations.png
│   ├── correlation_matrix.png
│   └── model_comparison.png
├── api/
│   └── predict_api.py              # Flask REST API
├── generate_data.py                # Synthetic data generator
├── ecommerce_sales_prediction.ipynb # Main analysis notebook
└── README.md
```

## Features

### Data Integration
- Merged 4 different data sources with proper key relationships
- Handled missing values using appropriate imputation strategies
- Removed duplicates and capped extreme outliers
- Converted date columns and ensured data type consistency

### Feature Engineering (16 new features created)
- **Time-based**: year, month, day, day_of_week, quarter, is_weekend
- **Seasonality**: is_holiday_season, is_summer
- **Product**: profit_margin, discount_amount, price_to_base_ratio
- **Customer**: customer_age_group, engagement_score
- **Interactions**: price_x_quantity, discount_x_price
- **Categorizations**: order_value_category

### Machine Learning Models

#### Model Performance

| Model               | Test MAE | Test RMSE | Test R² |
|---------------------|----------|-----------|---------|
| Linear Regression   | $1.94    | $19.57    | 0.9977  |
| Random Forest       | $1.48    | $20.24    | 0.9976  |
| Gradient Boosting   | $3.17    | $21.07    | 0.9974  |

**Best Model**: Linear Regression (highest R² score: 0.9977)

#### Cross-Validation Results (5-fold)
- **Random Forest**: MAE $1.97 (±$0.36)
- **Gradient Boosting**: MAE $3.24 (±$0.42)

### Key Insights from EDA

1. **Revenue Distribution**
   - Premium customers: 35.9%
   - Regular customers: 33.1%
   - Budget customers: 31.0%

2. **Top Categories by Revenue**
   - Food & Beverages: $1.07M
   - Beauty: $0.95M
   - Home & Garden: $0.88M

3. **Sales Patterns**
   - Higher sales during weekends
   - Seasonal peaks in November-December
   - Mobile devices dominate (35% of transactions)

4. **Feature Importance (Top 5)**
   - Total amount (before tax/shipping)
   - Unit price
   - Base price
   - Tax amount
   - Quantity

## Installation

### Prerequisites
```bash
Python 3.11+
```

### Dependencies
```bash
pip install pandas numpy matplotlib seaborn scikit-learn joblib flask jupyter
```

Or install from requirements file:
```bash
pip install -r requirements.txt
```

## Usage

### 1. Generate Synthetic Data
```bash
python generate_data.py
```

### 2. Run the Analysis Notebook
```bash
jupyter notebook ecommerce_sales_prediction.ipynb
```

### 3. Start the Prediction API
```bash
python api/predict_api.py
```

The API will be available at `http://localhost:5000`

### API Endpoints

#### GET /
Get API information and available endpoints

#### GET /health
Health check

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "models_loaded": 3,
  "features_count": 63
}
```

#### GET /models
List available models

#### GET /metrics
View model performance metrics

#### POST /predict
Make sales predictions

**Request:**
```json
{
  "model": "random_forest",
  "data": [
    {
      "quantity": 2,
      "unit_price": 150.0,
      "discount_percent": 10,
      ...
    }
  ]
}
```

**Response:**
```json
{
  "model_used": "random_forest",
  "predictions": [285.50],
  "prediction_count": 1,
  "statistics": {
    "mean": 285.50,
    "median": 285.50,
    "min": 285.50,
    "max": 285.50
  }
}
```

## Model Details

### Linear Regression
- **Type**: Ordinary Least Squares
- **Features**: 63 (29 numerical + 34 encoded categorical)
- **Scaling**: StandardScaler
- **Performance**: Best R² score (0.9977)

### Random Forest
- **Estimators**: 100 trees
- **Max Depth**: 15
- **Min Samples Split**: 10
- **Performance**: Best MAE ($1.48)

### Gradient Boosting
- **Estimators**: 100
- **Learning Rate**: 0.1
- **Max Depth**: 5
- **Performance**: Highest training R² (0.9987)

## Challenges Addressed

1. **Data Integration**
   - Successfully merged data from multiple sources with different schemas
   - Handled time zone inconsistencies and date format variations
   - Resolved join key mismatches between datasets

2. **Data Quality**
   - Handled 2-3% missing values using domain-appropriate imputation
   - Identified and removed 50 duplicate records
   - Capped extreme outliers (143 transactions) to preserve data

3. **Feature Engineering**
   - Created meaningful features from raw data
   - Encoded categorical variables properly (one-hot encoding)
   - Generated interaction features to capture relationships

4. **Model Selection**
   - Compared multiple algorithms systematically
   - Used cross-validation to avoid overfitting
   - Selected best model based on comprehensive metrics

5. **Scalability**
   - Designed modular prediction interface
   - Created deployment-ready API
   - Saved all preprocessing objects for consistency

## Future Enhancements

1. **Model Improvements**
   - Hyperparameter tuning with GridSearchCV/RandomizedSearchCV
   - Try XGBoost and LightGBM for better performance
   - Implement ensemble methods (stacking, voting)

2. **Feature Engineering**
   - Add customer lifetime value calculations
   - Include product recommendation features
   - Incorporate external data (holidays, promotions)

3. **Deployment**
   - Containerize with Docker
   - Deploy to cloud platform (AWS, Azure, GCP)
   - Add monitoring and logging
   - Implement A/B testing framework

4. **Real-time Predictions**
   - Stream processing pipeline
   - Real-time feature computation
   - Model serving with TensorFlow Serving

5. **MLOps**
   - Automated model retraining schedule
   - Model versioning and experiment tracking
   - Performance monitoring and drift detection
   - CI/CD pipeline for model deployment

## Results Summary

✅ **Data Integration**: Successfully merged 4 data sources (15,000+ transactions)
✅ **Model Performance**: Achieved 99.77% R² score with Linear Regression
✅ **Prediction Accuracy**: Average error of $1.94 per transaction
✅ **API Deployment**: Production-ready REST API with multiple endpoints
✅ **Documentation**: Comprehensive project documentation and code comments

## License

This project is for educational and demonstration purposes.

## Authors

Deep Learning Portfolio Project - E-Commerce Sales Prediction

## Acknowledgments

- Synthetic data generation inspired by real e-commerce patterns
- ML techniques based on scikit-learn best practices
- API design following RESTful principles
