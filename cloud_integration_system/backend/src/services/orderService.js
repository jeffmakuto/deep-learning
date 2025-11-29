/**
 * Order Service
 * Handles DynamoDB operations for orders
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

AWS.config.update({ region: process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE || 'orders-table';

class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(orderData) {
    const order = {
      id: uuidv4(),
      customerId: orderData.customerId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency || 'usd',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress
    };

    const params = {
      TableName: TABLE_NAME,
      Item: order
    };

    await retryWithBackoff(() => dynamodb.put(params).promise());
    logger.info('Order created in DynamoDB', { orderId: order.id });

    return order;
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: orderId }
    };

    const result = await retryWithBackoff(() => dynamodb.get(params).promise());
    return result.Item;
  }

  /**
   * Update order
   */
  static async updateOrder(orderId, updates) {
    updates.updatedAt = new Date().toISOString();

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      updateExpression.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = updates[key];
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { id: orderId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await retryWithBackoff(() => dynamodb.update(params).promise());
    logger.info('Order updated in DynamoDB', { orderId });

    return result.Attributes;
  }

  /**
   * List orders with pagination
   */
  static async listOrders({ limit = 20, lastKey = null }) {
    const params = {
      TableName: TABLE_NAME,
      Limit: limit
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await retryWithBackoff(() => dynamodb.scan(params).promise());

    return {
      items: result.Items,
      lastKey: result.LastEvaluatedKey 
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : null
    };
  }

  /**
   * Delete order (soft delete by updating status)
   */
  static async deleteOrder(orderId) {
    return await this.updateOrder(orderId, { 
      status: 'deleted',
      deletedAt: new Date().toISOString()
    });
  }

  /**
   * Get orders by customer
   */
  static async getOrdersByCustomer(customerId) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'customerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId
      }
    };

    const result = await retryWithBackoff(() => dynamodb.scan(params).promise());
    return result.Items;
  }
}

module.exports = OrderService;
