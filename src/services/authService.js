import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { User, Token } from '../models/index.js';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError,
  EmailError 
} from '../utils/errors.js';
import { TOKEN_TYPES, USER_ROLES, USER_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import emailService from './emailService.js';

/**
 * Authentication service
 * Handles user authentication, registration, password management, and token operations
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} - User and tokens
   */
  async register(userData) {
    try {
      const { firstName, lastName, email, password, role = USER_ROLES.USER } = userData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        status: USER_STATUS.ACTIVE,
      });

      await user.save();

      // Generate email verification token
      const emailToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, emailToken);
      } catch (emailError) {
        logger.error('Failed to send verification email', { error: emailError.message });
        // Don't fail registration if email fails
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user._id, tokens.refreshToken);

      logger.logSecurity('User registered', {
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.error('Registration failed', { error: error.message, email: userData.email });
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Object} - User and tokens
   */
  async login(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Find user by email
      const user = await User.findByEmail(email).select('+password');
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if user is active
      if (user.status !== USER_STATUS.ACTIVE) {
        throw new AuthenticationError('Account is not active');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new AuthenticationError('Invalid email or password');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const tokens = this.generateTokens(user, rememberMe);

      // Save refresh token
      await this.saveRefreshToken(user._id, tokens.refreshToken);

      logger.logSecurity('User logged in', {
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.logSecurity('Login failed', { 
        error: error.message, 
        email: credentials.email,
        ip: credentials.ip 
      });
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {boolean} - Success status
   */
  async logout(userId, refreshToken) {
    try {
      // Revoke specific refresh token
      if (refreshToken) {
        await Token.findOneAndUpdate(
          { token: refreshToken, userId, type: TOKEN_TYPES.REFRESH },
          { 
            isRevoked: true, 
            revokedAt: new Date(),
            revokedReason: 'user_logout'
          }
        );
      } else {
        // Revoke all user tokens
        await Token.revokeAllUserTokens(userId, 'user_logout');
      }

      logger.logSecurity('User logged out', { userId });

      return true;
    } catch (error) {
      logger.error('Logout failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Find valid refresh token
      const tokenDoc = await Token.findValidToken(refreshToken, TOKEN_TYPES.REFRESH);
      if (!tokenDoc) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      // Get user
      const user = await User.findById(tokenDoc.userId);
      if (!user || user.status !== USER_STATUS.ACTIVE) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Revoke old refresh token
      await tokenDoc.revoke();

      // Save new refresh token
      await this.saveRefreshToken(user._id, tokens.refreshToken);

      logger.logSecurity('Token refreshed', { userId: user._id });

      return tokens;
    } catch (error) {
      logger.logSecurity('Token refresh failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Forgot password
   * @param {string} email - User email
   * @returns {boolean} - Success status
   */
  async forgotPassword(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return true;
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        logger.error('Failed to send password reset email', { error: emailError.message });
        throw new EmailError('Failed to send password reset email');
      }

      logger.logSecurity('Password reset requested', { userId: user._id, email });

      return true;
    } catch (error) {
      logger.error('Forgot password failed', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new ValidationError('Invalid or expired password reset token');
      }

      // Reset password
      await user.resetPassword(newPassword);

      // Revoke all user tokens
      await Token.revokeAllUserTokens(user._id, 'password_change');

      logger.logSecurity('Password reset completed', { userId: user._id });

      return true;
    } catch (error) {
      logger.error('Password reset failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Revoke all user tokens except current session
      await Token.revokeAllUserTokens(userId, 'password_change');

      logger.logSecurity('Password changed', { userId });

      return true;
    } catch (error) {
      logger.error('Password change failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Verify email
   * @param {string} token - Email verification token
   * @returns {boolean} - Success status
   */
  async verifyEmail(token) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid verification token
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new ValidationError('Invalid or expired email verification token');
      }

      // Verify email
      await user.verifyEmail();

      logger.logSecurity('Email verified', { userId: user._id });

      return true;
    } catch (error) {
      logger.error('Email verification failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Resend email verification
   * @param {string} email - User email
   * @returns {boolean} - Success status
   */
  async resendEmailVerification(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Generate new verification token
      const emailToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, emailToken);
      } catch (emailError) {
        logger.error('Failed to send verification email', { error: emailError.message });
        throw new EmailError('Failed to send verification email');
      }

      logger.logSecurity('Email verification resent', { userId: user._id });

      return true;
    } catch (error) {
      logger.error('Resend email verification failed', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   * @param {Object} user - User object
   * @param {boolean} rememberMe - Remember me flag
   * @returns {Object} - Access and refresh tokens
   */
  generateTokens(user, rememberMe = false) {
    const accessTokenPayload = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      type: TOKEN_TYPES.ACCESS,
    };

    const refreshTokenPayload = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      type: TOKEN_TYPES.REFRESH,
    };

    const accessToken = jwt.sign(accessTokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    const refreshTokenExpiry = rememberMe ? '30d' : config.JWT_REFRESH_EXPIRE;
    const refreshToken = jwt.sign(refreshTokenPayload, config.JWT_REFRESH_SECRET, {
      expiresIn: refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRE,
    };
  }

  /**
   * Save refresh token to database
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - Saved token document
   */
  async saveRefreshToken(userId, refreshToken) {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(refreshToken);
      
      const tokenDoc = new Token({
        token: refreshToken,
        userId,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: new Date(decoded.exp * 1000),
        deviceInfo: {
          // This would be populated with actual device info in a real implementation
          userAgent: 'Unknown',
          ipAddress: 'Unknown',
          deviceType: 'unknown',
        },
      });

      return await tokenDoc.save();
    } catch (error) {
      logger.error('Failed to save refresh token', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Object} - User profile
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Get user profile failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Profile update data
   * @returns {Object} - Updated user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'bio', 'website', 'location'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      });

      await user.save();

      logger.logSecurity('User profile updated', { userId });

      return user.toJSON();
    } catch (error) {
      logger.error('Update user profile failed', { error: error.message, userId });
      throw error;
    }
  }
}

export default new AuthService();
