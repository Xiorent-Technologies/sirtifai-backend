import { DataTypes } from 'sequelize';
import { TOKEN_TYPES } from '../../config/constants.js';

/**
 * Token model for PostgreSQL using Sequelize
 * Alternative to MongoDB model for SQL databases
 */

export const defineTokenModel = (sequelize) => {
  const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TOKEN_TYPES)),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    revokedReason: {
      type: DataTypes.ENUM([
        'user_logout',
        'password_change',
        'admin_revoke',
        'security_breach',
        'expired',
      ]),
      allowNull: true,
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'tokens',
    timestamps: true,
    paranoid: false, // Don't soft delete tokens
    indexes: [
      {
        unique: true,
        fields: ['token'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['is_revoked'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['user_id', 'type'],
      },
      {
        fields: ['user_id', 'is_revoked'],
      },
      {
        fields: ['type', 'is_revoked'],
      },
    ],
    hooks: {
      beforeCreate: (token) => {
        if (!token.expiresAt) {
          const now = new Date();
          
          switch (token.type) {
            case TOKEN_TYPES.ACCESS:
              token.expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
              break;
            case TOKEN_TYPES.REFRESH:
              token.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
              break;
            case TOKEN_TYPES.RESET_PASSWORD:
              token.expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
              break;
            case TOKEN_TYPES.VERIFY_EMAIL:
              token.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
              break;
            default:
              token.expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
          }
        }
      },
    },
  });

  // Instance methods
  Token.prototype.revoke = function(revokedBy, reason = 'admin_revoke') {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revokedReason = reason;
    return this.save();
  };

  Token.prototype.isTokenValid = function() {
    return !this.isRevoked && this.expiresAt > new Date();
  };

  // Class methods
  Token.createToken = function(tokenData) {
    return this.create(tokenData);
  };

  Token.findValidToken = function(token, type) {
    const { Op } = require('sequelize');
    return this.findOne({
      where: {
        token,
        type,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status'],
      }],
    });
  };

  Token.revokeAllUserTokens = function(userId, reason = 'user_logout') {
    const { Op } = require('sequelize');
    return this.update(
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
      {
        where: {
          userId,
          isRevoked: false,
        },
      }
    );
  };

  Token.revokeUserTokensByType = function(userId, type, reason = 'user_logout') {
    const { Op } = require('sequelize');
    return this.update(
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
      {
        where: {
          userId,
          type,
          isRevoked: false,
        },
      }
    );
  };

  Token.cleanExpiredTokens = function() {
    const { Op } = require('sequelize');
    return this.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: new Date() } },
          {
            isRevoked: true,
            revokedAt: { [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days
          },
        ],
      },
    });
  };

  Token.getTokenStats = async function() {
    const { Op } = require('sequelize');
    
    const stats = await this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal('CASE WHEN is_revoked = false THEN 1 END')
          ),
          'active',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal('CASE WHEN is_revoked = true THEN 1 END')
          ),
          'revoked',
        ],
      ],
      group: ['type'],
      raw: true,
    });

    return stats;
  };

  Token.findByUser = function(userId, options = {}) {
    const { Op } = require('sequelize');
    const where = { userId };
    
    if (options.type) {
      where.type = options.type;
    }
    
    if (options.validOnly) {
      where.isRevoked = false;
      where.expiresAt = { [Op.gt]: new Date() };
    }
    
    return this.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
    });
  };

  Token.findActiveSessions = function(userId) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        userId,
        type: TOKEN_TYPES.REFRESH,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
  };

  Token.revokeOldSessions = async function(userId, keepLatest = 5) {
    const { Op } = require('sequelize');
    
    const tokens = await this.findAll({
      where: {
        userId,
        type: TOKEN_TYPES.REFRESH,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
      offset: keepLatest,
    });

    if (tokens.length > 0) {
      const tokenIds = tokens.map(token => token.id);
      return this.update(
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'session_limit_exceeded',
        },
        {
          where: {
            id: { [Op.in]: tokenIds },
          },
        }
      );
    }

    return { modifiedCount: 0 };
  };

  return Token;
};
