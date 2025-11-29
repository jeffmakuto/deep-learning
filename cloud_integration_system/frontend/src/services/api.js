/**
 * API Service
 * Handles all API calls to the backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API_KEY = process.env.REACT_APP_API_KEY || 'your_api_key_for_internal_services';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// Order API
export const orderAPI = {
  create: (orderData) => api.post('/api/orders', orderData),
  get: (orderId) => api.get(`/api/orders/${orderId}`),
  list: (params) => api.get('/api/orders', { params }),
  update: (orderId, updates) => api.patch(`/api/orders/${orderId}`, updates),
  cancel: (orderId) => api.delete(`/api/orders/${orderId}`)
};

// Payment API
export const paymentAPI = {
  confirm: (paymentIntentId, orderId) => 
    api.post('/api/payments/confirm', { paymentIntentId, orderId }),
  refund: (orderId, amount, reason) => 
    api.post('/api/payments/refund', { orderId, amount, reason }),
  get: (paymentIntentId) => api.get(`/api/payments/${paymentIntentId}`)
};

// Monitoring API
export const monitoringAPI = {
  getHealth: () => api.get('/api/monitoring/health'),
  getMetrics: (timeRange) => api.get('/api/monitoring/metrics', { params: { timeRange } }),
  getIntegrations: () => api.get('/api/monitoring/integrations'),
  getErrors: (limit) => api.get('/api/monitoring/errors', { params: { limit } })
};

export default api;
