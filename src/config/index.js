import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Application configuration
 * Centralized configuration management with environment variable support
 */

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  HOST: process.env.HOST || 'localhost',

  // Database Configuration
  DATABASE_TYPE: process.env.DATABASE_TYPE || 'mongodb', // 'mongodb' or 'postgresql'
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sirtifai_db',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sirtifai_test_db',
  
  // PostgreSQL
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'sirtifai_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_TEST_NAME: process.env.DB_TEST_NAME || 'sirtifai_test_db',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

  // Email Configuration
  PAYMENTS_EMAIL_HOST: process.env.PAYMENTS_EMAIL_HOST || 'smtp.gmail.com',
  PAYMENTS_EMAIL_PORT: parseInt(process.env.PAYMENTS_EMAIL_PORT, 10) || 587,
  PAYMENTS_EMAIL_USER: process.env.PAYMENTS_EMAIL_USER || '',
  PAYMENTS_EMAIL_PASSWORD: process.env.PAYMENTS_EMAIL_PASSWORD || '',
  PAYMENTS_EMAIL_FROM: process.env.PAYMENTS_EMAIL_FROM || 'payments@sirtifai.com',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',

  // API Configuration
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// Validation
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

if (config.NODE_ENV === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar] || process.env[envVar].includes('change-this-in-production')) {
      throw new Error(`Missing or invalid environment variable: ${envVar}`);
    }
  });
}

export { config };
export default config;
