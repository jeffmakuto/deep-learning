/**
 * Email Service
 * Handles email notifications via SendGrid
 */

const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME;

class EmailService {
  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(order) {
    const msg = {
      to: order.customerEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `Order Confirmation - #${order.id.substring(0, 8)}`,
      text: this.generateOrderConfirmationText(order),
      html: this.generateOrderConfirmationHTML(order)
    };

    try {
      await retryWithBackoff(() => sgMail.send(msg));
      logger.info('Order confirmation email sent', { 
        orderId: order.id,
        email: order.customerEmail 
      });
    } catch (error) {
      logger.error('Error sending order confirmation email', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(order) {
    const msg = {
      to: order.customerEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `Payment Received - Order #${order.id.substring(0, 8)}`,
      text: this.generatePaymentConfirmationText(order),
      html: this.generatePaymentConfirmationHTML(order)
    };

    try {
      await retryWithBackoff(() => sgMail.send(msg));
      logger.info('Payment confirmation email sent', { 
        orderId: order.id,
        email: order.customerEmail 
      });
    } catch (error) {
      logger.error('Error sending payment confirmation email', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  /**
   * Send payment failure email
   */
  static async sendPaymentFailure(order) {
    const msg = {
      to: order.customerEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `Payment Failed - Order #${order.id.substring(0, 8)}`,
      text: this.generatePaymentFailureText(order),
      html: this.generatePaymentFailureHTML(order)
    };

    try {
      await retryWithBackoff(() => sgMail.send(msg));
      logger.info('Payment failure email sent', { 
        orderId: order.id,
        email: order.customerEmail 
      });
    } catch (error) {
      logger.error('Error sending payment failure email', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  /**
   * Send order cancellation email
   */
  static async sendOrderCancellation(order) {
    const msg = {
      to: order.customerEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `Order Cancelled - #${order.id.substring(0, 8)}`,
      text: this.generateOrderCancellationText(order),
      html: this.generateOrderCancellationHTML(order)
    };

    try {
      await retryWithBackoff(() => sgMail.send(msg));
      logger.info('Order cancellation email sent', { 
        orderId: order.id,
        email: order.customerEmail 
      });
    } catch (error) {
      logger.error('Error sending order cancellation email', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  // Email template generators
  static generateOrderConfirmationText(order) {
    return `
Thank you for your order!

Order ID: ${order.id}
Total Amount: $${order.totalAmount.toFixed(2)}

Items:
${order.items.map(item => `- ${item.name} x${item.quantity} - $${item.price.toFixed(2)}`).join('\n')}

We'll send you another email when your payment is processed.

Best regards,
${FROM_NAME}
    `.trim();
  }

  static generateOrderConfirmationHTML(order) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .items { margin: 20px 0; }
    .item { padding: 10px; border-bottom: 1px solid #ddd; }
    .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>
    <div class="content">
      <p>Thank you for your order, ${order.customerName}!</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <div class="items">
        <h3>Items:</h3>
        ${order.items.map(item => `
          <div class="item">
            <strong>${item.name}</strong> x${item.quantity} - $${item.price.toFixed(2)}
          </div>
        `).join('')}
      </div>
      <div class="total">
        Total: $${order.totalAmount.toFixed(2)}
      </div>
      <p>We'll send you another email when your payment is processed.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  static generatePaymentConfirmationText(order) {
    return `
Payment Received!

Your payment for order #${order.id.substring(0, 8)} has been successfully processed.

Amount Paid: $${order.totalAmount.toFixed(2)}

Your order is now being prepared for shipment.

Best regards,
${FROM_NAME}
    `.trim();
  }

  static generatePaymentConfirmationHTML(order) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .success { color: #4CAF50; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
    </div>
    <div class="content">
      <p class="success">✓ Payment Successful</p>
      <p>Your payment for order #${order.id.substring(0, 8)} has been processed.</p>
      <p><strong>Amount Paid:</strong> $${order.totalAmount.toFixed(2)}</p>
      <p>Your order is now being prepared for shipment.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  static generatePaymentFailureText(order) {
    return `
Payment Failed

Unfortunately, we couldn't process your payment for order #${order.id.substring(0, 8)}.

Please try again or contact support for assistance.

Best regards,
${FROM_NAME}
    `.trim();
  }

  static generatePaymentFailureHTML(order) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f44336; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .error { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p class="error">✗ Payment Unsuccessful</p>
      <p>We couldn't process your payment for order #${order.id.substring(0, 8)}.</p>
      <p>Please try again or contact support for assistance.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  static generateOrderCancellationText(order) {
    return `
Order Cancelled

Your order #${order.id.substring(0, 8)} has been cancelled.

If you have any questions, please contact our support team.

Best regards,
${FROM_NAME}
    `.trim();
  }

  static generateOrderCancellationHTML(order) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Cancelled</h1>
    </div>
    <div class="content">
      <p>Your order #${order.id.substring(0, 8)} has been cancelled.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = EmailService;
