import express from 'express';
import userController from '../controllers/userController.js';
import { 
  authenticate, 
  requireAdmin, 
  requireAdminOrModerator,
  requireOwnershipOrAdmin 
} from '../middlewares/auth.js';
import { 
  validateParams, 
  validateQuery, 
  validateBody,
  commonSchemas,
  adminSchemas 
} from '../middlewares/validation.js';

const router = express.Router();

/**
 * User management routes
 * Handles user CRUD operations and administration
 */

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.post('/', 
  requireAdmin,
  validateBody(adminSchemas.createUser),
  userController.createUser
);

router.get('/stats', 
  requireAdmin,
  userController.getUserStats
);

router.post('/bulk-update', 
  requireAdmin,
  validateBody(adminSchemas.bulkAction),
  userController.bulkUpdateUsers
);

router.get('/export', 
  requireAdmin,
  validateQuery(commonSchemas.pagination),
  userController.exportUsers
);

// Admin and moderator routes
router.get('/', 
  requireAdminOrModerator,
  validateQuery(commonSchemas.pagination),
  userController.getUsers
);

router.get('/search', 
  requireAdminOrModerator,
  validateQuery(commonSchemas.search),
  userController.searchUsers
);

router.get('/role/:role', 
  requireAdminOrModerator,
  validateParams({ role: commonSchemas.id.pattern(/^(admin|user|moderator)$/) }),
  userController.getUsersByRole
);

// Individual user routes
router.get('/:id', 
  requireOwnershipOrAdmin('id'),
  validateParams(commonSchemas.id),
  userController.getUserById
);

router.put('/:id', 
  requireAdmin,
  validateParams(commonSchemas.id),
  validateBody(adminSchemas.updateUser),
  userController.updateUser
);

router.delete('/:id', 
  requireAdmin,
  validateParams(commonSchemas.id),
  userController.deleteUser
);

router.delete('/:id/permanent', 
  requireAdmin,
  validateParams(commonSchemas.id),
  userController.permanentlyDeleteUser
);

// User status management
router.patch('/:id/suspend', 
  requireAdmin,
  validateParams(commonSchemas.id),
  validateBody({ reason: require('joi').string().required() }),
  userController.suspendUser
);

router.patch('/:id/activate', 
  requireAdmin,
  validateParams(commonSchemas.id),
  userController.activateUser
);

router.patch('/:id/role', 
  requireAdmin,
  validateParams(commonSchemas.id),
  validateBody({ role: require('joi').string().valid('admin', 'user', 'moderator').required() }),
  userController.changeUserRole
);

// User activity
router.get('/:id/activity', 
  requireOwnershipOrAdmin('id'),
  validateParams(commonSchemas.id),
  validateQuery(commonSchemas.pagination),
  userController.getUserActivity
);

export default router;
