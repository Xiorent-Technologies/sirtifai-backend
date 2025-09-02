import { config } from '../config/index.js';
import databaseManager from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Jest test setup
 * Global test configuration and setup
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  try {
    // Connect to test database
    if (config.DATABASE_TYPE === 'mongodb') {
      await databaseManager.connectMongoDB();
    } else if (config.DATABASE_TYPE === 'postgresql') {
      await databaseManager.connectPostgreSQL();
    }
    
    logger.info('Test database connected');
  } catch (error) {
    logger.error('Test database connection failed', { error: error.message });
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Disconnect from test database
    await databaseManager.disconnect();
    logger.info('Test database disconnected');
  } catch (error) {
    logger.error('Test database disconnection failed', { error: error.message });
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clean up test data if needed
  try {
    if (config.DATABASE_TYPE === 'mongodb') {
      const mongoose = require('mongoose');
      const collections = await mongoose.connection.db.collections();
      
      for (let collection of collections) {
        await collection.deleteMany({});
      }
    } else if (config.DATABASE_TYPE === 'postgresql') {
      const { User, Token } = require('../models/sequelize/index.js');
      await User.destroy({ where: {}, force: true });
      await Token.destroy({ where: {}, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors
    logger.warn('Test cleanup failed', { error: error.message });
  }
});

// Global test utilities
global.testUtils = {
  // Generate test user data
  generateTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'user',
    ...overrides,
  }),

  // Generate test admin data
  generateTestAdmin: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'Admin',
    email: `admin${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'admin',
    ...overrides,
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random email
  randomEmail: () => `test${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`,
};

// Mock external services
jest.mock('../services/emailService.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendAccountSuspensionEmail: jest.fn().mockResolvedValue(true),
  sendPasswordChangeNotification: jest.fn().mockResolvedValue(true),
}));

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
