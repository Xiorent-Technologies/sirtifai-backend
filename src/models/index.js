/**
 * Database models index
 * Centralized export of all models for easy importing
 */

// MongoDB Models (Mongoose)
import User from './User.js';
import Token from './Token.js';

// Export all models
export {
  User,
  Token,
};

// Default export with all models
export default {
  User,
  Token,
};
