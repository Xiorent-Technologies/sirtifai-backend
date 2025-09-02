import { HTTP_STATUS } from '../config/constants.js';

/**
 * Standardized API response utility
 * Provides consistent response format across the application
 */

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
export const successResponse = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
    ...(Object.keys(meta).length > 0 && { meta }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Custom error code
 * @param {*} details - Additional error details
 */
export const errorResponse = (res, message = 'Internal Server Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, details = null) => {
  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Validation error response formatter
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 * @param {string} message - Error message
 */
export const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  const response = {
    success: false,
    message,
    error: {
      code: 'VALIDATION_ERROR',
      details: errors,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 */
export const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(HTTP_STATUS.OK).json(response);
};

/**
 * Created response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * No content response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
export const noContentResponse = (res, message = 'Operation completed successfully') => {
  return successResponse(res, null, message, HTTP_STATUS.NO_CONTENT);
};

/**
 * Not found response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

/**
 * Unauthorized response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
};

/**
 * Forbidden response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
};

/**
 * Conflict response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT');
};

/**
 * Rate limit response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const rateLimitResponse = (res, message = 'Too many requests') => {
  return errorResponse(res, message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Internal server error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} details - Error details
 */
export const internalErrorResponse = (res, message = 'Internal server error', details = null) => {
  return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', details);
};

/**
 * Service unavailable response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const serviceUnavailableResponse = (res, message = 'Service temporarily unavailable') => {
  return errorResponse(res, message, HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
};

/**
 * Health check response formatter
 * @param {Object} res - Express response object
 * @param {Object} healthData - Health check data
 */
export const healthResponse = (res, healthData) => {
  const response = {
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      ...healthData,
    },
  };

  return res.status(HTTP_STATUS.OK).json(response);
};
