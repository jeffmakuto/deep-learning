/**
 * Notification Service
 * Handles AWS SNS notifications
 */

const AWS = require('aws-sdk');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

AWS.config.update({ region: process.env.AWS_REGION });
const sns = new AWS.SNS();

const TOPIC_ARN = process.env.AWS_SNS_TOPIC_ARN;

class NotificationService {
  /**
   * Publish order created notification
   */
  static async publishOrderCreated(order) {
    const message = {
      event: 'order.created',
      orderId: order.id,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      totalAmount: order.totalAmount,
      currency: order.currency,
      timestamp: new Date().toISOString()
    };

    return await this.publishNotification('Order Created', message);
  }

  /**
   * Publish payment completed notification
   */
  static async publishPaymentCompleted(order) {
    const message = {
      event: 'payment.completed',
      orderId: order.id,
      paymentIntentId: order.paymentIntentId,
      amount: order.totalAmount,
      timestamp: new Date().toISOString()
    };

    return await this.publishNotification('Payment Completed', message);
  }

  /**
   * Publish order status changed notification
   */
  static async publishOrderStatusChanged(order, oldStatus) {
    const message = {
      event: 'order.status_changed',
      orderId: order.id,
      oldStatus,
      newStatus: order.status,
      timestamp: new Date().toISOString()
    };

    return await this.publishNotification('Order Status Changed', message);
  }

  /**
   * Publish error notification
   */
  static async publishError(error, context) {
    const message = {
      event: 'system.error',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    return await this.publishNotification('System Error', message, true);
  }

  /**
   * Generic publish notification method
   */
  static async publishNotification(subject, message, isError = false) {
    const params = {
      Subject: subject,
      Message: JSON.stringify(message, null, 2),
      TopicArn: TOPIC_ARN,
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: message.event || 'unknown'
        },
        priority: {
          DataType: 'String',
          StringValue: isError ? 'high' : 'normal'
        }
      }
    };

    try {
      const result = await retryWithBackoff(() => sns.publish(params).promise());
      logger.info('SNS notification published', { 
        subject,
        messageId: result.MessageId 
      });
      return result;
    } catch (error) {
      logger.error('Error publishing SNS notification', { 
        error: error.message,
        subject 
      });
      throw error;
    }
  }

  /**
   * Subscribe email to topic
   */
  static async subscribeEmail(email) {
    const params = {
      Protocol: 'email',
      TopicArn: TOPIC_ARN,
      Endpoint: email
    };

    try {
      const result = await sns.subscribe(params).promise();
      logger.info('Email subscribed to SNS topic', { 
        email,
        subscriptionArn: result.SubscriptionArn 
      });
      return result;
    } catch (error) {
      logger.error('Error subscribing email to SNS', { 
        error: error.message,
        email 
      });
      throw error;
    }
  }
}

module.exports = NotificationService;
