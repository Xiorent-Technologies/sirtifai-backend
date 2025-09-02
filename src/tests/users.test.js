import request from 'supertest';
import app from '../app.js';
import { User } from '../models/index.js';
import { testUtils } from './setup.js';

describe('Users API', () => {
  let adminToken;
  let userToken;
  let testUser;
  let testAdmin;

  beforeEach(async () => {
    testUser = testUtils.generateTestUser();
    testAdmin = testUtils.generateTestAdmin();

    // Create admin user
    const adminResponse = await request(app.getApp())
      .post('/api/v1/auth/register')
      .send({
        ...testAdmin,
        confirmPassword: testAdmin.password,
        acceptTerms: true,
      });

    adminToken = adminResponse.body.data.tokens.accessToken;

    // Create regular user
    const userResponse = await request(app.getApp())
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        confirmPassword: testUser.password,
        acceptTerms: true,
      });

    userToken = userResponse.body.data.tokens.accessToken;
  });

  describe('GET /api/v1/users', () => {
    it('should get users list for admin', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('pagination');
    });

    it('should get users list with pagination', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(5);
    });

    it('should get users list with search', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users?search=test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to get users list without admin role', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail to get users list without authentication', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    let userId;

    beforeEach(async () => {
      // Get user ID from the created user
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    });

    it('should get user by ID for admin', async () => {
      const response = await request(app.getApp())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should get own profile for regular user', async () => {
      const response = await request(app.getApp())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should fail to get other user profile for regular user', async () => {
      const adminUser = await User.findOne({ email: testAdmin.email });
      const adminUserId = adminUser._id.toString();

      const response = await request(app.getApp())
        .get(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail to get user with invalid ID', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create user successfully for admin', async () => {
      const newUser = testUtils.generateTestUser();

      const response = await request(app.getApp())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should fail to create user without admin role', async () => {
      const newUser = testUtils.generateTestUser();

      const response = await request(app.getApp())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create user with existing email', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create user with invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'weak',
      };

      const response = await request(app.getApp())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    });

    it('should update user successfully for admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'moderator',
      };

      const response = await request(app.getApp())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.role).toBe(updateData.role);
    });

    it('should fail to update user without admin role', async () => {
      const updateData = {
        firstName: 'Updated',
      };

      const response = await request(app.getApp())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail to update user with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        role: 'invalid-role',
      };

      const response = await request(app.getApp())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    });

    it('should delete user successfully for admin', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('should fail to delete user without admin role', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail to delete non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      
      const response = await request(app.getApp())
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/:id/suspend', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    });

    it('should suspend user successfully for admin', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/users/${userId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test suspension' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
    });

    it('should fail to suspend user without admin role', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/users/${userId}/suspend`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Test suspension' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/:id/activate', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.findOne({ email: testUser.email });
      userId = user._id.toString();
    });

    it('should activate user successfully for admin', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/users/${userId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should fail to activate user without admin role', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/users/${userId}/activate`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/stats', () => {
    it('should get user statistics for admin', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('verifiedUsers');
      expect(response.body.data).toHaveProperty('adminUsers');
    });

    it('should fail to get user statistics without admin role', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
