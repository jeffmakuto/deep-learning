"""
E-Commerce Data Generator
Generates realistic synthetic datasets for sales prediction system
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 12, 31)
NUM_CUSTOMERS = 1000
NUM_PRODUCTS = 200
NUM_TRANSACTIONS = 15000

print("Generating E-Commerce Datasets...")
print("=" * 60)

# 1. Generate Product Data
print("\n1. Generating Product Data...")
categories = ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Toys', 
              'Sports', 'Beauty', 'Food & Beverages']
brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE', 'Generic']

products = []
for i in range(1, NUM_PRODUCTS + 1):
    category = random.choice(categories)
    brand = random.choice(brands)
    base_price = round(random.uniform(10, 500), 2)
    
    products.append({
        'product_id': f'P{i:04d}',
        'product_name': f'{category} {brand} Item {i}',
        'category': category,
        'brand': brand,
        'base_price': base_price,
        'cost': round(base_price * random.uniform(0.4, 0.7), 2),
        'stock_quantity': random.randint(0, 500),
        'rating': round(random.uniform(2.5, 5.0), 1),
        'num_reviews': random.randint(0, 1000),
        'weight_kg': round(random.uniform(0.1, 10.0), 2),
        'is_featured': random.choice([True, False]),
        'discount_eligible': random.choice([True, False])
    })

df_products = pd.DataFrame(products)
df_products.to_csv('data/product_data.csv', index=False)
print(f"   ✓ Generated {len(df_products)} products")

# 2. Generate Customer Data
print("\n2. Generating Customer Data...")
cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 
          'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']
segments = ['Premium', 'Regular', 'Budget']

customers = []
for i in range(1, NUM_CUSTOMERS + 1):
    registration_date = START_DATE + timedelta(days=random.randint(0, 400))
    
    customers.append({
        'customer_id': f'C{i:05d}',
        'age': random.randint(18, 75),
        'gender': random.choice(['M', 'F', 'Other']),
        'city': random.choice(cities),
        'registration_date': registration_date.strftime('%Y-%m-%d'),
        'customer_segment': random.choice(segments),
        'is_premium_member': random.choice([True, False]),
        'email_subscribed': random.choice([True, False]),
        'preferred_category': random.choice(categories),
        'total_orders': 0,  # Will be updated from sales data
        'lifetime_value': 0.0  # Will be updated from sales data
    })

df_customers = pd.DataFrame(customers)
df_customers.to_csv('data/customer_data.csv', index=False)
print(f"   ✓ Generated {len(df_customers)} customers")

# 3. Generate Sales/Transaction Data
print("\n3. Generating Sales Transaction Data...")
transactions = []
transaction_id = 1

for _ in range(NUM_TRANSACTIONS):
    # Random date between start and end
    days_diff = (END_DATE - START_DATE).days
    transaction_date = START_DATE + timedelta(days=random.randint(0, days_diff))
    
    # Add seasonality and day-of-week patterns
    month = transaction_date.month
    day_of_week = transaction_date.weekday()
    
    # Higher sales in Nov-Dec (holiday season)
    seasonal_factor = 1.5 if month in [11, 12] else 1.0
    # Higher sales on weekends
    weekend_factor = 1.2 if day_of_week >= 5 else 1.0
    
    # Random customer and product
    customer_id = random.choice(df_customers['customer_id'].values)
    product_id = random.choice(df_products['product_id'].values)
    
    # Get product details
    product = df_products[df_products['product_id'] == product_id].iloc[0]
    base_price = product['base_price']
    
    # Quantity (more items during holidays)
    max_qty = int(3 * seasonal_factor)
    quantity = random.randint(1, max_qty)
    
    # Price with discount
    discount_pct = 0
    if random.random() < 0.3:  # 30% chance of discount
        discount_pct = random.choice([5, 10, 15, 20, 25])
    
    unit_price = base_price * (1 - discount_pct/100)
    total_amount = round(unit_price * quantity, 2)
    
    # Shipping and tax
    shipping_cost = round(random.uniform(0, 15), 2) if total_amount < 50 else 0
    tax = round(total_amount * 0.08, 2)
    
    # Payment method
    payment_method = random.choice(['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery'])
    
    # Order status
    status = random.choices(
        ['Completed', 'Cancelled', 'Returned', 'Pending'],
        weights=[0.85, 0.05, 0.05, 0.05]
    )[0]
    
    # Add transaction
    transactions.append({
        'transaction_id': f'T{transaction_id:06d}',
        'customer_id': customer_id,
        'product_id': product_id,
        'transaction_date': transaction_date.strftime('%Y-%m-%d'),
        'transaction_time': f'{random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00',
        'quantity': quantity,
        'unit_price': round(unit_price, 2),
        'discount_percent': discount_pct,
        'total_amount': total_amount,
        'shipping_cost': shipping_cost,
        'tax': tax,
        'grand_total': round(total_amount + shipping_cost + tax, 2),
        'payment_method': payment_method,
        'order_status': status,
        'device_type': random.choice(['Mobile', 'Desktop', 'Tablet']),
        'traffic_source': random.choice(['Organic', 'Paid Ads', 'Social Media', 'Direct', 'Email']),
    })
    
    transaction_id += 1

df_sales = pd.DataFrame(transactions)

# Add some missing values and outliers to make it realistic
# Missing values (2-3% missing data)
for col in ['shipping_cost', 'device_type', 'traffic_source']:
    missing_idx = np.random.choice(df_sales.index, size=int(len(df_sales) * 0.02), replace=False)
    df_sales.loc[missing_idx, col] = None

# Add a few duplicates
duplicates = df_sales.sample(n=50)
df_sales = pd.concat([df_sales, duplicates], ignore_index=True)

# Add some outliers (unusually high prices)
outlier_idx = np.random.choice(df_sales.index, size=20, replace=False)
df_sales.loc[outlier_idx, 'total_amount'] *= random.uniform(3, 5)
df_sales.loc[outlier_idx, 'grand_total'] = df_sales.loc[outlier_idx, 'total_amount'] + \
                                             df_sales.loc[outlier_idx, 'shipping_cost'].fillna(0) + \
                                             df_sales.loc[outlier_idx, 'tax']

df_sales.to_csv('data/sales_data.csv', index=False)
print(f"   ✓ Generated {len(df_sales)} transactions")

# 4. Generate Customer Behavior Data (browsing, clicks, etc.)
print("\n4. Generating Customer Behavior Data...")
behaviors = []

for customer_id in df_customers['customer_id'].sample(n=800):  # 80% of customers have behavior data
    num_sessions = random.randint(1, 50)
    
    for _ in range(num_sessions):
        session_date = START_DATE + timedelta(days=random.randint(0, days_diff))
        
        behaviors.append({
            'customer_id': customer_id,
            'session_date': session_date.strftime('%Y-%m-%d'),
            'session_duration_min': random.randint(1, 120),
            'pages_viewed': random.randint(1, 50),
            'products_viewed': random.randint(0, 30),
            'added_to_cart': random.randint(0, 10),
            'abandoned_cart': random.choice([True, False]),
            'search_queries': random.randint(0, 15),
            'email_opened': random.choice([True, False, None]),
            'email_clicked': random.choice([True, False, None]),
        })

df_behavior = pd.DataFrame(behaviors)
df_behavior.to_csv('data/customer_behavior.csv', index=False)
print(f"   ✓ Generated {len(df_behavior)} behavior records")

# Summary Statistics
print("\n" + "=" * 60)
print("DATA GENERATION SUMMARY")
print("=" * 60)
print(f"\n✓ Product Data: {len(df_products)} products across {len(categories)} categories")
print(f"✓ Customer Data: {len(df_customers)} customers from {len(cities)} cities")
print(f"✓ Sales Data: {len(df_sales)} transactions over 2 years")
print(f"✓ Behavior Data: {len(df_behavior)} customer sessions")
print(f"\nDate Range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
print(f"Total Revenue: ${df_sales[df_sales['order_status'] == 'Completed']['grand_total'].sum():,.2f}")
print("\nAll datasets saved to 'data/' directory!")
print("=" * 60)
