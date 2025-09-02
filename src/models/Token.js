import mongoose from 'mongoose';
import { TOKEN_TYPES } from '../config/constants.js';

/**
 * Token model for MongoDB using Mongoose
 * Manages JWT tokens, refresh tokens, and other authentication tokens
 */

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(TOKEN_TYPES),
    required: [true, 'Token type is required'],
    index: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true,
  },
  revokedAt: {
    type: Date,
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  revokedReason: {
    type: String,
    enum: ['user_logout', 'password_change', 'admin_revoke', 'security_breach', 'expired'],
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: String,
    os: String,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for better performance
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ userId: 1, isRevoked: 1 });
tokenSchema.index({ type: 1, isRevoked: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for token status
tokenSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for token validity
tokenSchema.virtual('isValid').get(function() {
  return !this.isRevoked && !this.isExpired;
});

// Pre-save middleware to set expiration based on token type
tokenSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const now = new Date();
    
    switch (this.type) {
      case TOKEN_TYPES.ACCESS:
        this.expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
        break;
      case TOKEN_TYPES.REFRESH:
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case TOKEN_TYPES.RESET_PASSWORD:
        this.expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
        break;
      case TOKEN_TYPES.VERIFY_EMAIL:
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      default:
        this.expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
  }
  next();
});

// Instance method to revoke token
tokenSchema.methods.revoke = function(revokedBy, reason = 'admin_revoke') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

// Instance method to check if token is valid
tokenSchema.methods.isTokenValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Static method to create token
tokenSchema.statics.createToken = function(tokenData) {
  return this.create(tokenData);
};

// Static method to find valid token
tokenSchema.statics.findValidToken = function(token, type) {
  return this.findOne({
    token,
    type,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId', 'firstName lastName email role status');
};

// Static method to revoke all user tokens
tokenSchema.statics.revokeAllUserTokens = function(userId, reason = 'user_logout') {
  return this.updateMany(
    { userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

// Static method to revoke all user tokens of specific type
tokenSchema.statics.revokeUserTokensByType = function(userId, type, reason = 'user_logout') {
  return this.updateMany(
    { userId, type, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

// Static method to clean expired tokens
tokenSchema.statics.cleanExpiredTokens = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days
    ],
  });
};

// Static method to get token statistics
tokenSchema.statics.getTokenStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          type: '$type',
          isRevoked: '$isRevoked',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.type',
        total: { $sum: '$count' },
        active: {
          $sum: {
            $cond: [{ $eq: ['$_id.isRevoked', false] }, '$count', 0],
          },
        },
        revoked: {
          $sum: {
            $cond: [{ $eq: ['$_id.isRevoked', true] }, '$count', 0],
          },
        },
      },
    },
  ]);
};

// Static method to find tokens by user
tokenSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.validOnly) {
    query.isRevoked = false;
    query.expiresAt = { $gt: new Date() };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to find active sessions
tokenSchema.statics.findActiveSessions = function(userId) {
  return this.find({
    userId,
    type: TOKEN_TYPES.REFRESH,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Static method to revoke old sessions
tokenSchema.statics.revokeOldSessions = function(userId, keepLatest = 5) {
  return this.find({
    userId,
    type: TOKEN_TYPES.REFRESH,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .skip(keepLatest)
    .then(tokens => {
      if (tokens.length > 0) {
        const tokenIds = tokens.map(token => token._id);
        return this.updateMany(
          { _id: { $in: tokenIds } },
          {
            $set: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: 'session_limit_exceeded',
            },
          }
        );
      }
      return { modifiedCount: 0 };
    });
};

// Transform function to remove sensitive data
tokenSchema.methods.toJSON = function() {
  const tokenObject = this.toObject();
  delete tokenObject.token; // Never expose the actual token
  return tokenObject;
};

// Create and export the model
const Token = mongoose.model('Token', tokenSchema);

export default Token;
