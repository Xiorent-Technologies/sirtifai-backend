import Joi from 'joi';
import { validationErrorResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Validation middleware using Joi
 * Provides request validation for different endpoints
 */

/**
 * Generic validation middleware
 * @param {Object} schema - Joi schema object
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.logSecurity('Validation failed', {
        source,
        errors,
        data: dataToValidate,
      });

      return validationErrorResponse(res, errors, 'Validation failed');
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate request query parameters
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request parameters
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Common validation schemas
 */

// User schemas
export const userSchemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required().trim(),
    lastName: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid('user', 'moderator').default('user'),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    acceptTerms: Joi.boolean().valid(true).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional().trim(),
    lastName: Joi.string().min(2).max(50).optional().trim(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    bio: Joi.string().max(500).optional().trim(),
    website: Joi.string().uri().optional(),
    location: Joi.string().max(100).optional().trim(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// Common schemas
export const commonSchemas = {
  id: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).optional().trim(),
    category: Joi.string().optional(),
    status: Joi.string().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional(),
  }),
};

// File upload schemas
export const fileSchemas = {
  upload: Joi.object({
    file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().required(),
      size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB max
    }).required(),
  }),

  imageUpload: Joi.object({
    file: Joi.object({
      mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
      size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB max
    }).required(),
  }),
};

// Admin schemas
export const adminSchemas = {
  createUser: Joi.object({
    firstName: Joi.string().min(2).max(50).required().trim(),
    lastName: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    role: Joi.string().valid('user', 'moderator', 'admin').default('user'),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional().trim(),
    lastName: Joi.string().min(2).max(50).optional().trim(),
    email: Joi.string().email().optional().lowercase().trim(),
    role: Joi.string().valid('user', 'moderator', 'admin').optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  }),

  bulkAction: Joi.object({
    action: Joi.string().valid('activate', 'deactivate', 'suspend', 'delete').required(),
    userIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
  }),
};

/**
 * Custom validation functions
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with score and feedback
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: [],
  };

  if (password.length < 8) {
    result.feedback.push('Password must be at least 8 characters long');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain at least one lowercase letter');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one uppercase letter');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.feedback.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    result.feedback.push('Password must contain at least one special character (@$!%*?&)');
  } else {
    result.score += 1;
  }

  result.isValid = result.score >= 4 && result.feedback.length === 0;

  return result;
};

/**
 * Sanitize input data
 * @param {*} data - Data to sanitize
 * @returns {*} - Sanitized data
 */
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Custom Joi validation for password confirmation
 */
export const passwordConfirmation = Joi.string().valid(Joi.ref('password')).messages({
  'any.only': 'Password confirmation does not match password',
});

/**
 * Custom Joi validation for future dates
 */
export const futureDate = Joi.date().min('now').messages({
  'date.min': 'Date must be in the future',
});

/**
 * Custom Joi validation for past dates
 */
export const pastDate = Joi.date().max('now').messages({
  'date.max': 'Date must be in the past',
});
