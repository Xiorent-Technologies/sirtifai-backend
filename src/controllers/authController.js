import authService from '../services/authService.js';
import { asyncHandler } from '../middlewares/error.js';
import { 
  successResponse, 
  createdResponse, 
  validationErrorResponse 
} from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Authentication controller
 * Handles authentication-related HTTP requests
 */

class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  register = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, confirmPassword, role, acceptTerms } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return validationErrorResponse(res, [
        { field: 'confirmPassword', message: 'Password confirmation does not match' }
      ]);
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      return validationErrorResponse(res, [
        { field: 'acceptTerms', message: 'You must accept the terms and conditions' }
      ]);
    }

    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    logger.logSecurity('User registration successful', {
      userId: result.user.id,
      email: result.user.email,
      ip: req.ip,
    });

    return createdResponse(res, result, 'User registered successfully. Please check your email to verify your account.');
  });

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  login = asyncHandler(async (req, res, next) => {
    const { email, password, rememberMe } = req.body;

    const result = await authService.login({
      email,
      password,
      rememberMe,
      ip: req.ip,
    });

    logger.logSecurity('User login successful', {
      userId: result.user.id,
      email: result.user.email,
      ip: req.ip,
    });

    return successResponse(res, result, 'Login successful');
  });

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  logout = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    await authService.logout(userId, refreshToken);

    logger.logSecurity('User logout successful', {
      userId,
      ip: req.ip,
    });

    return successResponse(res, null, 'Logout successful');
  });

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    return successResponse(res, tokens, 'Token refreshed successfully');
  });

  /**
   * Forgot password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    return successResponse(res, null, 'If an account with that email exists, we have sent a password reset link.');
  });

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  resetPassword = asyncHandler(async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return validationErrorResponse(res, [
        { field: 'confirmPassword', message: 'Password confirmation does not match' }
      ]);
    }

    await authService.resetPassword(token, password);

    return successResponse(res, null, 'Password reset successful. Please login with your new password.');
  });

  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return validationErrorResponse(res, [
        { field: 'confirmPassword', message: 'Password confirmation does not match' }
      ]);
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    logger.logSecurity('Password changed successfully', {
      userId,
      ip: req.ip,
    });

    return successResponse(res, null, 'Password changed successfully');
  });

  /**
   * Verify email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    await authService.verifyEmail(token);

    return successResponse(res, null, 'Email verified successfully');
  });

  /**
   * Resend email verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  resendEmailVerification = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    await authService.resendEmailVerification(email);

    return successResponse(res, null, 'Verification email sent successfully');
  });

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const user = await authService.getUserProfile(userId);

    return successResponse(res, user, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  updateProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await authService.updateUserProfile(userId, updateData);

    logger.logSecurity('Profile updated successfully', {
      userId,
      updatedFields: Object.keys(updateData),
      ip: req.ip,
    });

    return successResponse(res, user, 'Profile updated successfully');
  });

  /**
   * Get user sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getSessions = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // This would typically fetch from Token model
    // For now, return a placeholder response
    const sessions = [];

    return successResponse(res, sessions, 'Sessions retrieved successfully');
  });

  /**
   * Revoke session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  revokeSession = asyncHandler(async (req, res, next) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // This would typically revoke a specific session
    // For now, return success
    logger.logSecurity('Session revoked', {
      userId,
      sessionId,
      ip: req.ip,
    });

    return successResponse(res, null, 'Session revoked successfully');
  });

  /**
   * Revoke all sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  revokeAllSessions = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    await authService.logout(userId);

    logger.logSecurity('All sessions revoked', {
      userId,
      ip: req.ip,
    });

    return successResponse(res, null, 'All sessions revoked successfully');
  });
}

export default new AuthController();
