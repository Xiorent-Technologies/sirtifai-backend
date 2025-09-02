import { User } from '../models/index.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { USER_ROLES, USER_STATUS } from '../config/constants.js';
import { generatePagination } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * User service
 * Handles user management operations (CRUD, search, filtering, etc.)
 */

class UserService {
  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Object} - Users and pagination info
   */
  async getUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
        role,
        status,
        isEmailVerified,
      } = options;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (status) {
        query.status = status;
      }

      if (isEmailVerified !== undefined) {
        query.isEmailVerified = isEmailVerified;
      }

      // Build sort object
      const sortObj = {};
      sortObj[sort] = order === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .select('-password -emailVerificationToken -passwordResetToken'),
        User.countDocuments(query),
      ]);

      const pagination = generatePagination(page, limit, total);

      return {
        users,
        pagination,
      };
    } catch (error) {
      logger.error('Get users failed', { error: error.message, options });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} - User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password -emailVerificationToken -passwordResetToken');
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user by ID failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object} - User object
   */
  async getUserByEmail(email) {
    try {
      const user = await User.findByEmail(email).select('-password -emailVerificationToken -passwordResetToken');
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user by email failed', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data
   * @returns {Object} - Created user
   */
  async createUser(userData) {
    try {
      const { firstName, lastName, email, password, role = USER_ROLES.USER, status = USER_STATUS.ACTIVE } = userData;

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
        status,
        isEmailVerified: true, // Admin-created users are auto-verified
      });

      await user.save();

      logger.logSecurity('User created by admin', {
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Create user failed', { error: error.message, userData });
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if email is being changed and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw new ConflictError('User with this email already exists');
        }
      }

      // Update allowed fields
      const allowedFields = [
        'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 
        'bio', 'website', 'location', 'role', 'status', 'preferences'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      });

      await user.save();

      logger.logSecurity('User updated', {
        userId: user._id,
        updatedFields: Object.keys(updateData),
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Update user failed', { error: error.message, userId, updateData });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {string} userId - User ID
   * @returns {boolean} - Success status
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Soft delete by changing status
      user.status = USER_STATUS.INACTIVE;
      await user.save();

      logger.logSecurity('User deleted', { userId });

      return true;
    } catch (error) {
      logger.error('Delete user failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Permanently delete user
   * @param {string} userId - User ID
   * @returns {boolean} - Success status
   */
  async permanentlyDeleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await User.findByIdAndDelete(userId);

      logger.logSecurity('User permanently deleted', { userId });

      return true;
    } catch (error) {
      logger.error('Permanently delete user failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Suspend user
   * @param {string} userId - User ID
   * @param {string} reason - Suspension reason
   * @returns {Object} - Updated user
   */
  async suspendUser(userId, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.status = USER_STATUS.SUSPENDED;
      await user.save();

      logger.logSecurity('User suspended', { userId, reason });

      return user.toJSON();
    } catch (error) {
      logger.error('Suspend user failed', { error: error.message, userId, reason });
      throw error;
    }
  }

  /**
   * Activate user
   * @param {string} userId - User ID
   * @returns {Object} - Updated user
   */
  async activateUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.status = USER_STATUS.ACTIVE;
      await user.save();

      logger.logSecurity('User activated', { userId });

      return user.toJSON();
    } catch (error) {
      logger.error('Activate user failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Change user role
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @returns {Object} - Updated user
   */
  async changeUserRole(userId, newRole) {
    try {
      if (!Object.values(USER_ROLES).includes(newRole)) {
        throw new ValidationError('Invalid role');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const oldRole = user.role;
      user.role = newRole;
      await user.save();

      logger.logSecurity('User role changed', { userId, oldRole, newRole });

      return user.toJSON();
    } catch (error) {
      logger.error('Change user role failed', { error: error.message, userId, newRole });
      throw error;
    }
  }

  /**
   * Bulk update users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} updateData - Update data
   * @returns {Object} - Update result
   */
  async bulkUpdateUsers(userIds, updateData) {
    try {
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateData }
      );

      logger.logSecurity('Bulk update users', { 
        userIds, 
        updateData, 
        modifiedCount: result.modifiedCount 
      });

      return result;
    } catch (error) {
      logger.error('Bulk update users failed', { error: error.message, userIds, updateData });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Object} - User statistics
   */
  async getUserStats() {
    try {
      const stats = await User.getUserStats();
      return stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        adminUsers: 0,
      };
    } catch (error) {
      logger.error('Get user stats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Array} - Users with specified role
   */
  async getUsersByRole(role) {
    try {
      if (!Object.values(USER_ROLES).includes(role)) {
        throw new ValidationError('Invalid role');
      }

      const users = await User.findByRole(role);
      return users;
    } catch (error) {
      logger.error('Get users by role failed', { error: error.message, role });
      throw error;
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Object} - Search results and pagination
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const searchOptions = {
        ...options,
        search: searchTerm,
      };

      return await this.getUsers(searchOptions);
    } catch (error) {
      logger.error('Search users failed', { error: error.message, searchTerm, options });
      throw error;
    }
  }

  /**
   * Get user activity
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} - User activity data
   */
  async getUserActivity(userId, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // This would typically fetch from an activity log table
      // For now, return basic user activity info
      const activity = {
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        loginAttempts: user.loginAttempts,
        isLocked: user.isAccountLocked(),
      };

      return activity;
    } catch (error) {
      logger.error('Get user activity failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Export users data
   * @param {Object} options - Export options
   * @returns {Array} - Users data
   */
  async exportUsers(options = {}) {
    try {
      const { format = 'json', fields = [] } = options;

      let selectFields = '-password -emailVerificationToken -passwordResetToken';
      if (fields.length > 0) {
        selectFields = fields.join(' ');
      }

      const users = await User.find({})
        .select(selectFields)
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // Convert to CSV format
        return this.convertToCSV(users);
      }

      return users;
    } catch (error) {
      logger.error('Export users failed', { error: error.message, options });
      throw error;
    }
  }

  /**
   * Convert users data to CSV format
   * @param {Array} users - Users array
   * @returns {string} - CSV string
   */
  convertToCSV(users) {
    if (users.length === 0) return '';

    const headers = Object.keys(users[0].toObject());
    const csvHeaders = headers.join(',');
    
    const csvRows = users.map(user => {
      const userObj = user.toObject();
      return headers.map(header => {
        const value = userObj[header];
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return `"${value}"`;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }
}

export default new UserService();
