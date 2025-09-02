import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

/**
 * Custom error classes for better error handling
 * Provides structured error handling with proper HTTP status codes
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = ERROR_CODES.INTERNAL_ERROR, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT_ERROR);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_ERROR);
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service = null) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    this.service = service;
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
    this.operation = operation;
  }
}

/**
 * JWT error class
 */
export class JWTError extends AppError {
  constructor(message = 'Invalid token') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

/**
 * Email error class
 */
export class EmailError extends AppError {
  constructor(message = 'Email sending failed') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}

/**
 * File upload error class
 */
export class FileUploadError extends AppError {
  constructor(message = 'File upload failed') {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
}

/**
 * Error handler utility functions
 */

/**
 * Handle async errors in Express routes
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
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Check if error is operational
 * @param {Error} error - Error to check
 * @returns {boolean} - True if operational error
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convert error to operational error
 * @param {Error} error - Error to convert
 * @returns {AppError} - Operational error
 */
export const toOperationalError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message, error.details);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid data format');
  }

  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return new DatabaseError('Database operation failed');
  }

  if (error.name === 'JsonWebTokenError') {
    return new JWTError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new JWTError('Token expired');
  }

  // Default to internal server error
  return new AppError('Internal server error');
};

/**
 * Error response formatter for different environments
 * @param {Error} error - Error object
 * @param {boolean} isDevelopment - Development environment flag
 * @returns {Object} - Formatted error response
 */
export const formatErrorResponse = (error, isDevelopment = false) => {
  const response = {
    success: false,
    message: error.message || 'Internal server error',
    error: {
      code: error.errorCode || ERROR_CODES.INTERNAL_ERROR,
    },
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add additional details for specific error types
  if (error instanceof ValidationError && error.details) {
    response.error.details = error.details;
  }

  if (error instanceof ExternalServiceError && error.service) {
    response.error.service = error.service;
  }

  if (error instanceof DatabaseError && error.operation) {
    response.error.operation = error.operation;
  }

  return response;
};
