/**
 * Webhook Controller
 * Handles incoming webhooks from third-party services
 */

const express = require('express');
const router = express.Router();
const StripeService = require('../services/stripeService');
const OrderService = require('../services/orderService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = StripeService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Error processing webhook', { error: error.message, type: event.type });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });

  const orderId = paymentIntent.metadata.orderId;
  if (orderId) {
    await OrderService.updateOrder(orderId, {
      status: 'paid',
      paymentStatus: 'completed',
      paidAt: new Date().toISOString()
    });

    const order = await OrderService.getOrder(orderId);
    await EmailService.sendPaymentConfirmation(order);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
  logger.warn('Payment failed', { paymentIntentId: paymentIntent.id });

  const orderId = paymentIntent.metadata.orderId;
  if (orderId) {
    await OrderService.updateOrder(orderId, {
      status: 'payment_failed',
      paymentStatus: 'failed',
      paymentError: paymentIntent.last_payment_error?.message
    });

    const order = await OrderService.getOrder(orderId);
    await EmailService.sendPaymentFailure(order);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  logger.info('Refund processed', { chargeId: charge.id });

  // Find order by payment intent
  const orderId = charge.metadata?.orderId;
  if (orderId) {
    await OrderService.updateOrder(orderId, {
      status: 'refunded',
      refundedAt: new Date().toISOString()
    });
  }
}

module.exports = router;
