import request from 'supertest';
import app from '../app.js';
import { User } from '../models/index.js';
import { testUtils } from './setup.js';

describe('Authentication API', () => {
  let testUser;
  let testAdmin;

  beforeEach(() => {
    testUser = testUtils.generateTestUser();
    testAdmin = testUtils.generateTestAdmin();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail to register with invalid email', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register with weak password', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          password: 'weak',
          confirmPassword: 'weak',
          acceptTerms: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register with mismatched passwords', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: 'DifferentPassword123!',
          acceptTerms: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register without accepting terms', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: false,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register with existing email', async () => {
      // First registration
      await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      // Second registration with same email
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail to login with invalid email', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail to login with invalid password', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail to login with missing credentials', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail to refresh with missing token', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh-token')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      accessToken = registerResponse.body.data.tokens.accessToken;
      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to logout without authentication', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/logout')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should fail to get profile without authentication', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let accessToken;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          acceptTerms: true,
        });

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio',
      };

      const response = await request(app.getApp())
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('should fail to update profile without authentication', async () => {
      const response = await request(app.getApp())
        .put('/api/v1/auth/profile')
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
