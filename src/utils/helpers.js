import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { REGEX } from '../config/constants.js';

/**
 * Utility helper functions
 * Common helper functions used across the application
 */

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @param {string} charset - Character set to use
 * @returns {string} - Random string
 */
export const generateRandomString = (length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Secure random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a UUID v4
 * @returns {string} - UUID v4 string
 */
export const generateUUID = () => {
  return uuidv4();
};

/**
 * Hash a string using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} - Hashed string
 */
export const hashString = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number
 */
export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after specified time
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} - Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Remove undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} - Cleaned object
 */
export const removeUndefined = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

/**
 * Convert object keys to camelCase
 * @param {Object} obj - Object to convert
 * @returns {Object} - Object with camelCase keys
 */
export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        converted[camelKey] = toCamelCase(obj[key]);
      }
    }
    return converted;
  }
  return obj;
};

/**
 * Convert object keys to snake_case
 * @param {Object} obj - Object to convert
 * @returns {Object} - Object with snake_case keys
 */
export const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        converted[snakeKey] = toSnakeCase(obj[key]);
      }
    }
    return converted;
  }
  return obj;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  return REGEX.EMAIL.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid password
 */
export const isValidPassword = (password) => {
  return REGEX.PASSWORD.test(password);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone
 */
export const isValidPhone = (phone) => {
  return REGEX.PHONE.test(phone);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username
 */
export const isValidUsername = (username) => {
  return REGEX.USERNAME.test(username);
};

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
export const toTitleCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination metadata
 */
export const generatePagination = (page, limit, total) => {
  const pages = Math.ceil(total / limit);
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total: parseInt(total, 10),
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};

/**
 * Mask sensitive data (email, phone, etc.)
 * @param {string} data - Data to mask
 * @param {string} type - Type of data (email, phone, etc.)
 * @returns {string} - Masked data
 */
export const maskSensitiveData = (data, type = 'default') => {
  if (!data || typeof data !== 'string') return data;

  switch (type) {
    case 'email':
      const [localPart, domain] = data.split('@');
      if (localPart.length <= 2) return data;
      return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
    
    case 'phone':
      if (data.length <= 4) return data;
      return `${'*'.repeat(data.length - 4)}${data.slice(-4)}`;
    
    case 'creditCard':
      if (data.length <= 4) return data;
      return `${'*'.repeat(data.length - 4)}${data.slice(-4)}`;
    
    default:
      if (data.length <= 4) return data;
      return `${data.slice(0, 2)}${'*'.repeat(data.length - 4)}${data.slice(-2)}`;
  }
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};
