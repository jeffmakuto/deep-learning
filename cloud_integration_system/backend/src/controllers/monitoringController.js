/**
 * Monitoring Controller
 * Provides endpoints for system monitoring and metrics
 */

const express = require('express');
const router = express.Router();
const MetricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /api/monitoring/health
 * Comprehensive health check
 */
router.get('/health', async (req, res, next) => {
  try {
    const health = await MetricsService.getSystemHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error checking system health', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/monitoring/metrics
 * Get system metrics
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const { timeRange = '1h' } = req.query;
    const metrics = await MetricsService.getMetrics(timeRange);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error retrieving metrics', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/monitoring/integrations
 * Get integration status
 */
router.get('/integrations', async (req, res, next) => {
  try {
    const integrationStatus = await MetricsService.getIntegrationStatus();

    res.json({
      success: true,
      data: integrationStatus
    });
  } catch (error) {
    logger.error('Error retrieving integration status', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/monitoring/errors
 * Get recent errors
 */
router.get('/errors', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const errors = await MetricsService.getRecentErrors(limit);

    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    logger.error('Error retrieving errors', { error: error.message });
    next(error);
  }
});

module.exports = router;
