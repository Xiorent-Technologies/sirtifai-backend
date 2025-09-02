import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston logger configuration
 * Provides structured logging with different levels and transports
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create transports array
const transports = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    format: config.NODE_ENV === 'production' ? logFormat : consoleFormat,
  })
);

// File transports for production
if (config.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'sirtifai-backend' },
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

logger.logError = (error, req = null) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
    }),
  });
};

logger.logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

logger.logDatabase = (operation, collection, details) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...details,
  });
};

export default logger;
