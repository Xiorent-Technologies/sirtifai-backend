import express from 'express';
import authController from '../controllers/authController.js';
import { 
  authenticate, 
  verifyRefreshToken, 
  authRateLimit 
} from '../middlewares/auth.js';
import { 
  validateBody, 
  userSchemas 
} from '../middlewares/validation.js';
import { passwordResetRateLimit } from '../middlewares/security.js';

const router = express.Router();

/**
 * Authentication routes
 * Handles user authentication, registration, and account management
 */

// Public routes (no authentication required)
router.post('/register', 
  authRateLimit,
  validateBody(userSchemas.register),
  authController.register
);

router.post('/login', 
  authRateLimit,
  validateBody(userSchemas.login),
  authController.login
);

router.post('/refresh-token', 
  validateBody(userSchemas.refreshToken),
  authController.refreshToken
);

router.post('/forgot-password', 
  passwordResetRateLimit,
  validateBody(userSchemas.forgotPassword),
  authController.forgotPassword
);

router.post('/reset-password', 
  passwordResetRateLimit,
  validateBody(userSchemas.resetPassword),
  authController.resetPassword
);

router.get('/verify-email/:token', 
  authController.verifyEmail
);

router.post('/resend-verification', 
  passwordResetRateLimit,
  validateBody(userSchemas.forgotPassword), // Reuse schema for email
  authController.resendEmailVerification
);

// Protected routes (authentication required)
router.use(authenticate); // All routes below require authentication

router.post('/logout', 
  validateBody(userSchemas.refreshToken),
  authController.logout
);

router.post('/change-password', 
  validateBody(userSchemas.changePassword),
  authController.changePassword
);

router.get('/profile', 
  authController.getProfile
);

router.put('/profile', 
  validateBody(userSchemas.updateProfile),
  authController.updateProfile
);

router.get('/sessions', 
  authController.getSessions
);

router.delete('/sessions/:sessionId', 
  authController.revokeSession
);

router.delete('/sessions', 
  authController.revokeAllSessions
);

export default router;
