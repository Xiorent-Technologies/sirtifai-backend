import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { config } from '../config/index.js';
import { rateLimitResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Security middleware configuration
 * Provides comprehensive security measures for the application
 */

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (config.CORS_ORIGIN.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Helmet security headers configuration
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * Rate limiting configuration
 */
export const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.logSecurity('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
      });
      return rateLimitResponse(res, 'Too many requests from this IP, please try again later.');
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.url === '/health' || req.url === '/api/v1/health';
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General rate limiter
 */
export const generalRateLimit = createRateLimit();

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    timestamp: new Date().toISOString(),
  },
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    },
    timestamp: new Date().toISOString(),
  },
});

/**
 * API rate limiter
 */
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
});

/**
 * MongoDB injection sanitization
 */
export const mongoSanitizeOptions = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.logSecurity('MongoDB injection attempt detected', {
      ip: req.ip,
      key,
      url: req.url,
      method: req.method,
    });
  },
};

/**
 * HTTP Parameter Pollution protection
 */
export const hppOptions = {
  whitelist: ['sort', 'order', 'page', 'limit'], // Allow these parameters to be duplicated
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userId: req.user?.id,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP)) {
      return next();
    }

    logger.logSecurity('IP not in whitelist', {
      ip: clientIP,
      url: req.url,
      method: req.method,
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: {
        code: 'IP_NOT_WHITELISTED',
      },
      timestamp: new Date().toISOString(),
    });
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);
    const maxSizeBytes = parseSize(maxSize);

    if (contentLength > maxSizeBytes) {
      logger.logSecurity('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize: maxSizeBytes,
        url: req.url,
        method: req.method,
      });

      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: {
          code: 'REQUEST_TOO_LARGE',
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., '10mb', '1gb')
 * @returns {number} - Size in bytes
 */
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return Math.floor(value * units[unit]);
};

/**
 * Suspicious activity detection
 */
export const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /on\w+\s*=/i, // Event handler injection
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.url;
  const body = JSON.stringify(req.body || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(userAgent)) {
      logger.logSecurity('Suspicious activity detected', {
        ip: req.ip,
        userAgent,
        url,
        pattern: pattern.toString(),
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        message: 'Suspicious activity detected',
        error: {
          code: 'SUSPICIOUS_ACTIVITY',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  next();
};

/**
 * API key validation middleware
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
      error: {
        code: 'API_KEY_REQUIRED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // In a real implementation, you would validate the API key against a database
  // For now, we'll just check if it's not empty
  if (apiKey.length < 10) {
    logger.logSecurity('Invalid API key', {
      ip: req.ip,
      apiKey: apiKey.substring(0, 5) + '...',
      url: req.url,
      method: req.method,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      error: {
        code: 'INVALID_API_KEY',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
