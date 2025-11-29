/**
 * Order Controller
 * Handles order creation, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const StripeService = require('../services/stripeService');
const EmailService = require('../services/emailService');
const SheetsService = require('../services/sheetsService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { validateOrder } = require('../middleware/validation');

/**
 * POST /api/orders
 * Create a new order and trigger integrations
 */
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const orderData = req.body;
    logger.info('Creating new order', { customerId: orderData.customerId });

    // Step 1: Create order in DynamoDB
    const order = await OrderService.createOrder(orderData);
    logger.info('Order created in database', { orderId: order.id });

    // Step 2: Process payment with Stripe
    const payment = await StripeService.createPaymentIntent({
      amount: order.totalAmount,
      currency: 'usd',
      orderId: order.id,
      customerEmail: order.customerEmail
    });
    
    order.paymentIntentId = payment.id;
    await OrderService.updateOrder(order.id, { paymentIntentId: payment.id });
    logger.info('Payment intent created', { paymentIntentId: payment.id });

    // Step 3: Send order to Google Sheets (async, non-blocking)
    SheetsService.addOrderToSheet(order)
      .then(() => logger.info('Order synced to Google Sheets', { orderId: order.id }))
      .catch(err => logger.error('Failed to sync to Google Sheets', { error: err.message }));

    // Step 4: Send confirmation email (async, non-blocking)
    EmailService.sendOrderConfirmation(order)
      .then(() => logger.info('Confirmation email sent', { orderId: order.id }))
      .catch(err => logger.error('Failed to send email', { error: err.message }));

    // Step 5: Send notification via SNS
    NotificationService.publishOrderCreated(order)
      .then(() => logger.info('SNS notification sent', { orderId: order.id }))
      .catch(err => logger.error('Failed to send SNS notification', { error: err.message }));

    res.status(201).json({
      success: true,
      data: {
        order,
        clientSecret: payment.client_secret
      },
      message: 'Order created successfully'
    });

  } catch (error) {
    logger.error('Error creating order', { error: error.message, stack: error.stack });
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Retrieve order by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrderService.getOrder(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Error retrieving order', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/orders
 * List all orders with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, lastKey } = req.query;
    const result = await OrderService.listOrders({ limit, lastKey });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        lastKey: result.lastKey,
        hasMore: !!result.lastKey
      }
    });

  } catch (error) {
    logger.error('Error listing orders', { error: error.message });
    next(error);
  }
});

/**
 * PATCH /api/orders/:id
 * Update order status
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedOrder = await OrderService.updateOrder(id, updates);

    // Sync update to Google Sheets
    SheetsService.updateOrderInSheet(updatedOrder)
      .catch(err => logger.error('Failed to update Google Sheets', { error: err.message }));

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (error) {
    logger.error('Error updating order', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/orders/:id
 * Cancel an order
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrderService.getOrder(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Cancel payment if exists
    if (order.paymentIntentId) {
      await StripeService.cancelPaymentIntent(order.paymentIntentId);
    }

    // Update order status
    await OrderService.updateOrder(id, { status: 'cancelled' });

    // Send cancellation email
    EmailService.sendOrderCancellation(order)
      .catch(err => logger.error('Failed to send cancellation email', { error: err.message }));

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    logger.error('Error cancelling order', { error: error.message });
    next(error);
  }
});

module.exports = router;
