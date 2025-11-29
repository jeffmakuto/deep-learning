# API Documentation

## Cloud Integration System - REST API Reference

**Base URL**: `http://localhost:3000` (development) or `https://your-domain.com` (production)

**Version**: 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Orders API](#orders-api)
3. [Payments API](#payments-api)
4. [Monitoring API](#monitoring-api)
5. [Webhooks](#webhooks)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except webhooks and health check) require authentication.

### Methods

#### 1. API Key Authentication
```http
X-API-Key: your_api_key
```

#### 2. JWT Token Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'X-API-Key': 'your_api_key'
  }
});
```

---

## Orders API

### Create Order

Creates a new order and initiates payment process.

**Endpoint**: `POST /api/orders`

**Authentication**: Required

**Request Body**:
```json
{
  "customerId": "cust_abc123",
  "customerEmail": "john.doe@example.com",
  "customerName": "John Doe",
  "items": [
    {
      "id": "item_1",
      "name": "Product A",
      "quantity": 2,
      "price": 29.99
    },
    {
      "id": "item_2",
      "name": "Product B",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "totalAmount": 109.97,
  "currency": "usd",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customerId": "cust_abc123",
      "customerEmail": "john.doe@example.com",
      "customerName": "John Doe",
      "items": [...],
      "totalAmount": 109.97,
      "currency": "usd",
      "status": "pending",
      "paymentStatus": "pending",
      "paymentIntentId": "pi_xxx",
      "createdAt": "2025-11-29T10:30:00Z",
      "updatedAt": "2025-11-29T10:30:00Z"
    },
    "clientSecret": "pi_xxx_secret_yyy"
  },
  "message": "Order created successfully"
}
```

**Integrations Triggered**:
- ✅ DynamoDB: Order stored
- ✅ Stripe: Payment intent created
- ✅ SendGrid: Confirmation email sent (async)
- ✅ Google Sheets: Order synced (async)
- ✅ SNS: Notification published (async)

---

### Get Order

Retrieves order details by ID.

**Endpoint**: `GET /api/orders/:id`

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "cust_abc123",
    "customerEmail": "john.doe@example.com",
    "customerName": "John Doe",
    "items": [...],
    "totalAmount": 109.97,
    "currency": "usd",
    "status": "paid",
    "paymentStatus": "completed",
    "paymentIntentId": "pi_xxx",
    "paidAt": "2025-11-29T10:35:00Z",
    "createdAt": "2025-11-29T10:30:00Z",
    "updatedAt": "2025-11-29T10:35:00Z"
  }
}
```

---

### List Orders

Retrieves paginated list of orders.

**Endpoint**: `GET /api/orders`

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of orders to return (default: 20, max: 100)
- `lastKey` (optional): Pagination key from previous response

**Example**:
```http
GET /api/orders?limit=10&lastKey=eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customerName": "John Doe",
      "totalAmount": 109.97,
      "status": "paid",
      "createdAt": "2025-11-29T10:30:00Z"
    },
    ...
  ],
  "pagination": {
    "lastKey": "eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
    "hasMore": true
  }
}
```

---

### Update Order

Updates order details.

**Endpoint**: `PATCH /api/orders/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456789"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "shipped",
    "trackingNumber": "1Z999AA10123456789",
    "updatedAt": "2025-11-29T11:00:00Z"
  },
  "message": "Order updated successfully"
}
```

---

### Cancel Order

Cancels an order and refunds payment if applicable.

**Endpoint**: `DELETE /api/orders/:id`

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Integrations Triggered**:
- ✅ Stripe: Payment cancelled/refunded
- ✅ SendGrid: Cancellation email sent
- ✅ DynamoDB: Order status updated

---

## Payments API

### Confirm Payment

Confirms a successful payment.

**Endpoint**: `POST /api/payments/confirm`

**Authentication**: Required

**Request Body**:
```json
{
  "paymentIntentId": "pi_xxx",
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "status": "succeeded"
  }
}
```

---

### Create Refund

Processes a refund for an order.

**Endpoint**: `POST /api/payments/refund`

**Authentication**: Required

**Request Body**:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 109.97,
  "reason": "requested_by_customer"
}
```

**Refund Reasons**:
- `duplicate`
- `fraudulent`
- `requested_by_customer`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "id": "re_xxx",
    "amount": 10997,
    "status": "succeeded",
    "created": 1701234567
  }
}
```

---

### Get Payment Details

Retrieves payment intent details.

**Endpoint**: `GET /api/payments/:paymentIntentId`

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "pi_xxx",
    "amount": 10997,
    "currency": "usd",
    "status": "succeeded",
    "created": 1701234567,
    "metadata": {
      "orderId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

## Monitoring API

### System Health

Gets comprehensive system health status.

**Endpoint**: `GET /api/monitoring/health`

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-29T12:00:00Z",
    "status": "healthy",
    "services": {
      "dynamodb": {
        "status": "up",
        "latency": 45
      },
      "stripe": {
        "status": "up",
        "latency": 120
      },
      "sendgrid": {
        "status": "configured"
      },
      "googleSheets": {
        "status": "configured"
      },
      "sns": {
        "status": "up"
      }
    }
  }
}
```

---

### Get Metrics

Retrieves system metrics for specified time range.

**Endpoint**: `GET /api/monitoring/metrics`

**Authentication**: Required

**Query Parameters**:
- `timeRange`: Time range for metrics (e.g., `1h`, `24h`, `7d`)

**Example**:
```http
GET /api/monitoring/metrics?timeRange=24h
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "timeRange": {
      "start": "2025-11-28T12:00:00Z",
      "end": "2025-11-29T12:00:00Z"
    },
    "orders": {
      "total": 145,
      "successful": 132,
      "failed": 8,
      "pending": 5
    },
    "revenue": {
      "total": 12345.67,
      "currency": "usd"
    },
    "integrations": {
      "stripe": {
        "calls": 290,
        "errors": 3
      },
      "sendgrid": {
        "calls": 145,
        "errors": 2
      },
      "googleSheets": {
        "calls": 145,
        "errors": 1
      },
      "sns": {
        "calls": 145,
        "errors": 0
      }
    }
  }
}
```

---

### Get Integration Status

Retrieves current status of all integrations.

**Endpoint**: `GET /api/monitoring/integrations`

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-29T12:00:00Z",
    "integrations": {
      "stripe": {
        "name": "Stripe Payment Gateway",
        "status": "operational",
        "lastChecked": "2025-11-29T12:00:00Z",
        "uptime": "99.9%"
      },
      "sendgrid": {
        "name": "SendGrid Email Service",
        "status": "operational",
        "lastChecked": "2025-11-29T12:00:00Z",
        "uptime": "99.8%"
      },
      "googleSheets": {
        "name": "Google Sheets API",
        "status": "operational",
        "lastChecked": "2025-11-29T12:00:00Z",
        "uptime": "99.9%"
      },
      "aws": {
        "name": "AWS Services",
        "status": "operational",
        "lastChecked": "2025-11-29T12:00:00Z",
        "services": {
          "dynamodb": "operational",
          "sns": "operational",
          "cloudwatch": "operational"
        }
      }
    }
  }
}
```

---

### Get Recent Errors

Retrieves recent error logs.

**Endpoint**: `GET /api/monitoring/errors`

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of errors to return (default: 50)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "timestamp": "2025-11-29T11:45:00Z",
        "level": "error",
        "message": "Failed to sync order to Google Sheets",
        "service": "sheetsService",
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "error": "Rate limit exceeded"
      }
    ],
    "count": 1,
    "period": "24h"
  }
}
```

---

## Webhooks

### Stripe Webhook

Receives webhook events from Stripe.

**Endpoint**: `POST /webhooks/stripe`

**Authentication**: Stripe signature verification

**Headers**:
```http
Stripe-Signature: t=1701234567,v1=xxx,v0=yyy
```

**Supported Events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Response**: `200 OK`
```json
{
  "received": true
}
```

---

## Error Handling

All errors follow a consistent format:

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Validation error: customerEmail must be a valid email"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |
| 502 | Bad Gateway (external service error) |

---

## Rate Limiting

**Limits**:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701234567
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests from this IP, please try again later."
  }
}
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'X-API-Key': 'your_api_key'
  }
});

// Create order
const createOrder = async () => {
  try {
    const response = await api.post('/api/orders', {
      customerId: 'cust_123',
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      items: [
        { id: 'item_1', name: 'Product A', quantity: 1, price: 29.99 }
      ],
      totalAmount: 29.99,
      currency: 'usd',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    });
    console.log('Order created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Python

```python
import requests

API_URL = 'http://localhost:3000'
API_KEY = 'your_api_key'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Create order
def create_order():
    data = {
        'customerId': 'cust_123',
        'customerEmail': 'john@example.com',
        'customerName': 'John Doe',
        'items': [
            {'id': 'item_1', 'name': 'Product A', 'quantity': 1, 'price': 29.99}
        ],
        'totalAmount': 29.99,
        'currency': 'usd',
        'shippingAddress': {
            'street': '123 Main St',
            'city': 'New York',
            'state': 'NY',
            'zipCode': '10001',
            'country': 'USA'
        }
    }
    
    response = requests.post(f'{API_URL}/api/orders', json=data, headers=headers)
    print(response.json())
```

---

**API Version**: 1.0.0  
**Last Updated**: November 29, 2025
