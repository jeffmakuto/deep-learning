/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

const logger = require('../utils/logger');
const NotificationService = require('../services/notificationService');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class IntegrationError extends AppError {
  constructor(service, message) {
    super(`${service} integration error: ${message}`, 502);
    this.service = service;
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;

  // Log error
  logger.error('Error occurred', {
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode
  });

  // Send error notification for critical errors
  if (statusCode >= 500) {
    NotificationService.publishError(err, {
      path: req.path,
      method: req.method,
      user: req.user?.id
    }).catch(notifErr => {
      logger.error('Failed to send error notification', { 
        error: notifErr.message 
      });
    });
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Internal server error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  IntegrationError
};
