import { DataTypes } from 'sequelize';
import { USER_ROLES, USER_STATUS } from '../../config/constants.js';

/**
 * User model for PostgreSQL using Sequelize
 * Alternative to MongoDB model for SQL databases
 */

export const defineUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      defaultValue: USER_ROLES.USER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      defaultValue: USER_STATUS.ACTIVE,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^\+?[\d\s\-\(\)]+$/,
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0],
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      defaultValue: 'https://via.placeholder.com/150x150?text=User',
      validate: {
        isUrl: true,
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
    },
    socialAccounts: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    twoFactorAuth: {
      type: DataTypes.JSONB,
      defaultValue: {
        enabled: false,
        secret: null,
        backupCodes: [],
      },
    },
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['last_login'],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const bcrypt = await import('bcryptjs');
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const bcrypt = await import('bcryptjs');
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.isAccountLocked = function() {
    return !!(this.lockUntil && this.lockUntil > new Date());
  };

  User.prototype.incLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil < new Date()) {
      return this.update({
        lockUntil: null,
        loginAttempts: 1,
      });
    }

    const updates = { loginAttempts: this.loginAttempts + 1 };
    
    if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }

    return this.update(updates);
  };

  User.prototype.resetLoginAttempts = function() {
    return this.update({
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    });
  };

  User.prototype.generateEmailVerificationToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return token;
  };

  User.prototype.generatePasswordResetToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return token;
  };

  User.prototype.verifyEmail = function() {
    this.isEmailVerified = true;
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
    return this.save();
  };

  User.prototype.resetPassword = function(newPassword) {
    this.password = newPassword;
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
    this.loginAttempts = 0;
    this.lockUntil = null;
    return this.save();
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };

  User.findActiveUsers = function() {
    return this.findAll({ where: { status: USER_STATUS.ACTIVE } });
  };

  User.findByRole = function(role) {
    return this.findAll({ where: { role, status: USER_STATUS.ACTIVE } });
  };

  User.getUserStats = async function() {
    const { Op } = require('sequelize');
    
    const [totalUsers, activeUsers, verifiedUsers, adminUsers] = await Promise.all([
      this.count(),
      this.count({ where: { status: USER_STATUS.ACTIVE } }),
      this.count({ where: { isEmailVerified: true } }),
      this.count({ where: { role: USER_ROLES.ADMIN } }),
    ]);

    return [{
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
    }];
  };

  return User;
};
