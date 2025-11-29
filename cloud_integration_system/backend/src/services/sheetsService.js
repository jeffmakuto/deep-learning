/**
 * Google Sheets Service
 * Handles synchronization with Google Sheets for analytics
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_SHEETS_CREDENTIALS;

class SheetsService {
  constructor() {
    this.sheets = null;
    this.initialized = false;
  }

  /**
   * Initialize Google Sheets API
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;
      logger.info('Google Sheets API initialized');
    } catch (error) {
      logger.error('Error initializing Google Sheets API', { error: error.message });
      throw error;
    }
  }

  /**
   * Add order to Google Sheet
   */
  async addOrderToSheet(order) {
    await this.initialize();

    const row = [
      order.id,
      order.customerId,
      order.customerName,
      order.customerEmail,
      order.totalAmount,
      order.currency,
      order.status,
      order.paymentStatus,
      order.items.length,
      order.createdAt,
      order.updatedAt
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row]
      }
    };

    try {
      await retryWithBackoff(() => this.sheets.spreadsheets.values.append(request));
      logger.info('Order added to Google Sheets', { orderId: order.id });
    } catch (error) {
      logger.error('Error adding order to Google Sheets', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  /**
   * Update order in Google Sheet
   */
  async updateOrderInSheet(order) {
    await this.initialize();

    try {
      // Find the row with this order ID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Orders!A:K'
      });

      const rows = response.data.values;
      const rowIndex = rows.findIndex(row => row[0] === order.id);

      if (rowIndex === -1) {
        // Order not found, add it
        return await this.addOrderToSheet(order);
      }

      // Update the existing row
      const updatedRow = [
        order.id,
        order.customerId,
        order.customerName,
        order.customerEmail,
        order.totalAmount,
        order.currency,
        order.status,
        order.paymentStatus,
        order.items.length,
        order.createdAt,
        order.updatedAt
      ];

      const updateRequest = {
        spreadsheetId: SPREADSHEET_ID,
        range: `Orders!A${rowIndex + 1}:K${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [updatedRow]
        }
      };

      await retryWithBackoff(() => this.sheets.spreadsheets.values.update(updateRequest));
      logger.info('Order updated in Google Sheets', { orderId: order.id });
    } catch (error) {
      logger.error('Error updating order in Google Sheets', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  /**
   * Create initial sheet structure if needed
   */
  async setupSheet() {
    await this.initialize();

    const headers = [
      'Order ID',
      'Customer ID',
      'Customer Name',
      'Customer Email',
      'Total Amount',
      'Currency',
      'Status',
      'Payment Status',
      'Items Count',
      'Created At',
      'Updated At'
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A1:K1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    };

    try {
      await this.sheets.spreadsheets.values.update(request);
      logger.info('Google Sheets headers created');
    } catch (error) {
      logger.error('Error setting up Google Sheets', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SheetsService();
