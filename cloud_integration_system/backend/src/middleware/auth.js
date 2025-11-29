/**
 * Authentication Middleware
 * Handles API key and JWT authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;
const API_KEY = process.env.API_KEY;

/**
 * Verify API key
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new UnauthorizedError('API key is required'));
  }

  if (apiKey !== API_KEY) {
    logger.warn('Invalid API key attempt', { ip: req.ip });
    return next(new UnauthorizedError('Invalid API key'));
  }

  next();
}

/**
 * Verify JWT token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { error: error.message, ip: req.ip });
    return next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * Combined auth middleware (checks API key or JWT)
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  if (apiKey) {
    return verifyApiKey(req, res, next);
  } else if (authHeader) {
    return verifyToken(req, res, next);
  } else {
    return next(new UnauthorizedError('Authentication required'));
  }
}

/**
 * Generate JWT token
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Optional authentication (doesn't fail if no auth provided)
 */
function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  if (!apiKey && !authHeader) {
    return next();
  }

  authenticate(req, res, next);
}

module.exports = authenticate;
module.exports.verifyApiKey = verifyApiKey;
module.exports.verifyToken = verifyToken;
module.exports.generateToken = generateToken;
module.exports.optionalAuth = optionalAuth;
