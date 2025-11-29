/**
 * Logger Utility
 * Winston-based logging with CloudWatch integration
 */

const winston = require('winston');
const AWS = require('aws-sdk');

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logger
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'cloud-integration-system' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transports
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Add CloudWatch transport in production
if (process.env.NODE_ENV === 'production' && process.env.CLOUDWATCH_LOG_GROUP) {
  const WinstonCloudWatch = require('winston-cloudwatch');
  
  logger.add(new WinstonCloudWatch({
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
    awsRegion: process.env.AWS_REGION,
    messageFormatter: ({ level, message, ...meta }) => {
      return JSON.stringify({ level, message, ...meta });
    }
  }));
}

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
