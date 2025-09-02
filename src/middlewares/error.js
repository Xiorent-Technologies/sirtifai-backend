import { config } from '../config/index.js';
import { AppError, isOperationalError, toOperationalError, formatErrorResponse } from '../utils/errors.js';
import { internalErrorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 * Centralized error handling for the application
 */

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (error, req, res, next) => {
  // Log the error
  logger.logError(error, req);

  // Convert error to operational error if needed
  const operationalError = toOperationalError(error);

  // Determine if we should send error details to client
  const isDevelopment = config.NODE_ENV === 'development';
  const isOperational = isOperationalError(operationalError);

  // Send error response
  if (isOperational) {
    const errorResponse = formatErrorResponse(operationalError, isDevelopment);
    return res.status(operationalError.statusCode).json(errorResponse);
  }

  // For non-operational errors, don't leak error details
  logger.error('Non-operational error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  return internalErrorResponse(res, 'Something went wrong!');
};

/**
 * Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

/**
 * Handle async errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise: promise.toString(),
    });

    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Handle SIGTERM signal
 */
export const handleSIGTERM = () => {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    
    // Close server gracefully
    process.exit(0);
  });
};

/**
 * Handle SIGINT signal (Ctrl+C)
 */
export const handleSIGINT = () => {
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    
    // Close server gracefully
    process.exit(0);
  });
};

/**
 * Validation error handler
 * @param {Error} error - Validation error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validationErrorHandler = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    logger.logSecurity('Validation error', {
      errors,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
      timestamp: new Date().toISOString(),
    });
  }

  next(error);
};

/**
 * JWT error handler
 * @param {Error} error - JWT error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const jwtErrorHandler = (error, req, res, next) => {
  if (error.name === 'JsonWebTokenError') {
    logger.logSecurity('JWT error', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === 'TokenExpiredError') {
    logger.logSecurity('JWT expired', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: {
        code: 'TOKEN_EXPIRED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next(error);
};

/**
 * Database error handler
 * @param {Error} error - Database error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const databaseErrorHandler = (error, req, res, next) => {
  if (error.name === 'CastError') {
    logger.logSecurity('Database cast error', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: {
        code: 'INVALID_ID',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];

    logger.logSecurity('Database duplicate key error', {
      field,
      value,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      error: {
        code: 'DUPLICATE_KEY',
        field,
        value,
      },
      timestamp: new Date().toISOString(),
    });
  }

  next(error);
};

/**
 * Rate limit error handler
 * @param {Error} error - Rate limit error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.status === 429) {
    logger.logSecurity('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next(error);
};

/**
 * Initialize error handlers
 */
export const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
  handleSIGTERM();
  handleSIGINT();
};

/**
 * Error response formatter for different environments
 * @param {Error} error - Error object
 * @param {boolean} isDevelopment - Development environment flag
 * @returns {Object} - Formatted error response
 */
export const formatError = (error, isDevelopment = false) => {
  const response = {
    success: false,
    message: error.message || 'Internal server error',
    error: {
      code: error.code || 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add additional details for specific error types
  if (error.details) {
    response.error.details = error.details;
  }

  if (error.field) {
    response.error.field = error.field;
  }

  return response;
};
