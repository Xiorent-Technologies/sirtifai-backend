import userService from '../services/userService.js';
import { asyncHandler } from '../middlewares/error.js';
import { 
  successResponse, 
  createdResponse, 
  noContentResponse 
} from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * User controller
 * Handles user management HTTP requests
 */

class UserController {
  /**
   * Get all users with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUsers = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      role,
      status,
      isEmailVerified,
    } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      order,
      search,
      role,
      status,
      isEmailVerified: isEmailVerified === 'true' ? true : isEmailVerified === 'false' ? false : undefined,
    };

    const result = await userService.getUsers(options);

    return successResponse(res, result.users, 'Users retrieved successfully', 200, {
      pagination: result.pagination,
    });
  });

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    return successResponse(res, user, 'User retrieved successfully');
  });

  /**
   * Create new user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  createUser = asyncHandler(async (req, res, next) => {
    const userData = req.body;
    const adminId = req.user.id;

    const user = await userService.createUser(userData);

    logger.logSecurity('User created by admin', {
      adminId,
      newUserId: user.id,
      newUserEmail: user.email,
      ip: req.ip,
    });

    return createdResponse(res, user, 'User created successfully');
  });

  /**
   * Update user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user.id;

    const user = await userService.updateUser(id, updateData);

    logger.logSecurity('User updated by admin', {
      adminId,
      userId: id,
      updatedFields: Object.keys(updateData),
      ip: req.ip,
    });

    return successResponse(res, user, 'User updated successfully');
  });

  /**
   * Delete user (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const adminId = req.user.id;

    await userService.deleteUser(id);

    logger.logSecurity('User deleted by admin', {
      adminId,
      userId: id,
      ip: req.ip,
    });

    return noContentResponse(res, 'User deleted successfully');
  });

  /**
   * Permanently delete user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  permanentlyDeleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const adminId = req.user.id;

    await userService.permanentlyDeleteUser(id);

    logger.logSecurity('User permanently deleted by admin', {
      adminId,
      userId: id,
      ip: req.ip,
    });

    return noContentResponse(res, 'User permanently deleted successfully');
  });

  /**
   * Suspend user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  suspendUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const user = await userService.suspendUser(id, reason);

    logger.logSecurity('User suspended by admin', {
      adminId,
      userId: id,
      reason,
      ip: req.ip,
    });

    return successResponse(res, user, 'User suspended successfully');
  });

  /**
   * Activate user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  activateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await userService.activateUser(id);

    logger.logSecurity('User activated by admin', {
      adminId,
      userId: id,
      ip: req.ip,
    });

    return successResponse(res, user, 'User activated successfully');
  });

  /**
   * Change user role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  changeUserRole = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    const user = await userService.changeUserRole(id, role);

    logger.logSecurity('User role changed by admin', {
      adminId,
      userId: id,
      newRole: role,
      ip: req.ip,
    });

    return successResponse(res, user, 'User role changed successfully');
  });

  /**
   * Bulk update users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  bulkUpdateUsers = asyncHandler(async (req, res, next) => {
    const { userIds, updateData } = req.body;
    const adminId = req.user.id;

    const result = await userService.bulkUpdateUsers(userIds, updateData);

    logger.logSecurity('Bulk update users by admin', {
      adminId,
      userIds,
      updateData,
      modifiedCount: result.modifiedCount,
      ip: req.ip,
    });

    return successResponse(res, result, 'Users updated successfully');
  });

  /**
   * Get user statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUserStats = asyncHandler(async (req, res, next) => {
    const stats = await userService.getUserStats();

    return successResponse(res, stats, 'User statistics retrieved successfully');
  });

  /**
   * Get users by role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUsersByRole = asyncHandler(async (req, res, next) => {
    const { role } = req.params;

    const users = await userService.getUsersByRole(role);

    return successResponse(res, users, 'Users retrieved successfully');
  });

  /**
   * Search users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  searchUsers = asyncHandler(async (req, res, next) => {
    const { q: searchTerm } = req.query;
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      role,
      status,
      isEmailVerified,
    } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      order,
      role,
      status,
      isEmailVerified: isEmailVerified === 'true' ? true : isEmailVerified === 'false' ? false : undefined,
    };

    const result = await userService.searchUsers(searchTerm, options);

    return successResponse(res, result.users, 'Search results retrieved successfully', 200, {
      pagination: result.pagination,
    });
  });

  /**
   * Get user activity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getUserActivity = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const options = req.query;

    const activity = await userService.getUserActivity(id, options);

    return successResponse(res, activity, 'User activity retrieved successfully');
  });

  /**
   * Export users data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  exportUsers = asyncHandler(async (req, res, next) => {
    const { format = 'json', fields } = req.query;
    const adminId = req.user.id;

    const options = {
      format,
      fields: fields ? fields.split(',') : [],
    };

    const data = await userService.exportUsers(options);

    logger.logSecurity('Users data exported by admin', {
      adminId,
      format,
      ip: req.ip,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      return res.send(data);
    }

    return successResponse(res, data, 'Users data exported successfully');
  });
}

export default new UserController();
