/**
 * Payment Controller
 * Handles payment processing and Stripe interactions
 */

const express = require('express');
const router = express.Router();
const StripeService = require('../services/stripeService');
const OrderService = require('../services/orderService');
const logger = require('../utils/logger');

/**
 * POST /api/payments/confirm
 * Confirm a payment intent
 */
router.post('/confirm', async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await OrderService.updateOrder(orderId, {
        status: 'paid',
        paymentStatus: 'completed',
        paidAt: new Date().toISOString()
      });

      logger.info('Payment confirmed', { orderId, paymentIntentId });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: { status: paymentIntent.status }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: { status: paymentIntent.status }
      });
    }

  } catch (error) {
    logger.error('Error confirming payment', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/payments/refund
 * Process a refund
 */
router.post('/refund', async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    const order = await OrderService.getOrder(orderId);
    if (!order || !order.paymentIntentId) {
      return res.status(404).json({
        success: false,
        message: 'Order or payment not found'
      });
    }

    const refund = await StripeService.createRefund({
      paymentIntentId: order.paymentIntentId,
      amount,
      reason
    });

    await OrderService.updateOrder(orderId, {
      status: 'refunded',
      refundId: refund.id,
      refundedAt: new Date().toISOString()
    });

    logger.info('Refund processed', { orderId, refundId: refund.id });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });

  } catch (error) {
    logger.error('Error processing refund', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/payments/:paymentIntentId
 * Retrieve payment details
 */
router.get('/:paymentIntentId', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);

    res.json({
      success: true,
      data: paymentIntent
    });

  } catch (error) {
    logger.error('Error retrieving payment', { error: error.message });
    next(error);
  }
});

module.exports = router;
