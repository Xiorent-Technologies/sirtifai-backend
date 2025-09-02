import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticationError, AuthorizationError, JWTError } from '../utils/errors.js';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.js';
import { TOKEN_TYPES, USER_ROLES } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Authentication and authorization middleware
 * Handles JWT token verification and role-based access control
 */

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return unauthorizedResponse(res, 'Access token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Check token type
    if (decoded.type !== TOKEN_TYPES.ACCESS) {
      return unauthorizedResponse(res, 'Invalid token type');
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tokenType: decoded.type,
    };

    logger.logSecurity('Token verified', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    next();
  } catch (error) {
    logger.logSecurity('Token verification failed', {
      error: error.message,
      token: req.headers.authorization?.substring(0, 20) + '...',
    });

    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token has expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid token');
    }

    return unauthorizedResponse(res, 'Token verification failed');
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Check token type
    if (decoded.type === TOKEN_TYPES.ACCESS) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tokenType: decoded.type,
      };
    }

    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.logSecurity('Optional token verification failed', {
      error: error.message,
    });
    next();
  }
};

/**
 * Verify refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return unauthorizedResponse(res, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    
    // Check token type
    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      return unauthorizedResponse(res, 'Invalid refresh token type');
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tokenType: decoded.type,
    };

    next();
  } catch (error) {
    logger.logSecurity('Refresh token verification failed', {
      error: error.message,
    });

    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Refresh token has expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid refresh token');
    }

    return unauthorizedResponse(res, 'Refresh token verification failed');
  }
};

/**
 * Check if user has required role
 * @param {...string} roles - Required roles
 * @returns {Function} - Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      logger.logSecurity('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = (req, res, next) => {
  return authorize(USER_ROLES.ADMIN)(req, res, next);
};

/**
 * Check if user is admin or moderator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdminOrModerator = (req, res, next) => {
  return authorize(USER_ROLES.ADMIN, USER_ROLES.MODERATOR)(req, res, next);
};

/**
 * Check if user can access resource (owner or admin)
 * @param {string} userIdParam - Parameter name containing user ID
 * @returns {Function} - Express middleware function
 */
export const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (req.user.role === USER_ROLES.ADMIN || req.user.id === resourceUserId) {
      return next();
    }

    logger.logSecurity('Ownership check failed', {
      userId: req.user.id,
      userRole: req.user.role,
      resourceUserId,
    });

    return forbiddenResponse(res, 'Access denied - insufficient permissions');
  };
};

/**
 * Check if user is active
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  // This would typically check user status from database
  // For now, we'll assume all authenticated users are active
  // In a real implementation, you'd fetch user from database and check status
  
  next();
};

/**
 * Rate limiting for authentication endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authRateLimit = (req, res, next) => {
  // This would integrate with your rate limiting middleware
  // For now, just pass through
  next();
};

/**
 * Generate JWT tokens
 * @param {Object} user - User object
 * @returns {Object} - Access and refresh tokens
 */
export const generateTokens = (user) => {
  const accessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: TOKEN_TYPES.ACCESS,
  };

  const refreshTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: TOKEN_TYPES.REFRESH,
  };

  const accessToken = jwt.sign(accessTokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });

  const refreshToken = jwt.sign(refreshTokenPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRE,
  };
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
