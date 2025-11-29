/**
 * Cloud Integration System - Main Server
 * 
 * This is the entry point for the backend API server that orchestrates
 * integrations between e-commerce platform and third-party services.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const authMiddleware = require('./src/middleware/auth');

// Import routes
const orderRoutes = require('./src/controllers/orderController');
const paymentRoutes = require('./src/controllers/paymentController');
const webhookRoutes = require('./src/controllers/webhookController');
const monitoringRoutes = require('./src/controllers/monitoringController');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Webhook endpoints (raw body needed for signature verification)
app.use('/webhooks/stripe', 
  bodyParser.raw({ type: 'application/json' }), 
  webhookRoutes
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'cloud-integration-system'
  });
});

// API routes (with authentication)
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/monitoring', authMiddleware, monitoringRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cloud Integration System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      orders: '/api/orders',
      payments: '/api/payments',
      monitoring: '/api/monitoring',
      webhooks: '/webhooks/*'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
