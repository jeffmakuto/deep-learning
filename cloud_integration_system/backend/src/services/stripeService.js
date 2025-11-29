/**
 * Stripe Service
 * Handles Stripe payment processing
 */

const Stripe = require('stripe');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

class StripeService {
  /**
   * Create a payment intent
   */
  static async createPaymentIntent({ amount, currency, orderId, customerEmail }) {
    try {
      const paymentIntent = await retryWithBackoff(() =>
        stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: { orderId },
          receipt_email: customerEmail,
          automatic_payment_methods: {
            enabled: true,
          }
        })
      );

      logger.info('Payment intent created', { 
        paymentIntentId: paymentIntent.id,
        orderId 
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent', { 
        error: error.message,
        orderId 
      });
      throw error;
    }
  }

  /**
   * Retrieve payment intent
   */
  static async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await retryWithBackoff(() =>
        stripe.paymentIntents.retrieve(paymentIntentId)
      );

      return paymentIntent;
    } catch (error) {
      logger.error('Error retrieving payment intent', { 
        error: error.message,
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Cancel payment intent
   */
  static async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await retryWithBackoff(() =>
        stripe.paymentIntents.cancel(paymentIntentId)
      );

      logger.info('Payment intent cancelled', { paymentIntentId });
      return paymentIntent;
    } catch (error) {
      logger.error('Error cancelling payment intent', { 
        error: error.message,
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Create a refund
   */
  static async createRefund({ paymentIntentId, amount, reason }) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        reason: reason || 'requested_by_customer'
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await retryWithBackoff(() =>
        stripe.refunds.create(refundParams)
      );

      logger.info('Refund created', { 
        refundId: refund.id,
        paymentIntentId 
      });

      return refund;
    } catch (error) {
      logger.error('Error creating refund', { 
        error: error.message,
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Construct webhook event from request
   */
  static constructWebhookEvent(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create customer
   */
  static async createCustomer({ email, name, metadata }) {
    try {
      const customer = await retryWithBackoff(() =>
        stripe.customers.create({
          email,
          name,
          metadata
        })
      );

      logger.info('Stripe customer created', { customerId: customer.id });
      return customer;
    } catch (error) {
      logger.error('Error creating customer', { error: error.message });
      throw error;
    }
  }
}

module.exports = StripeService;
