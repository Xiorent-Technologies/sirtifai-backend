import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import healthRoutes from './health.js';
import docsRoutes from './docs.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * Main routes index
 * Centralized routing configuration
 */

// Health check routes (no versioning)
router.use('/health', healthRoutes);

// API documentation routes
router.use('/api-docs', docsRoutes);

// API routes with versioning
router.use(`${config.API_PREFIX}/auth`, authRoutes);
router.use(`${config.API_PREFIX}/users`, userRoutes);

// API documentation route
router.get(`${config.API_PREFIX}/docs`, (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    data: {
      version: config.API_VERSION,
      documentation: '/api-docs',
      openApiSpec: '/api-docs/swagger.json',
      endpoints: {
        auth: `${config.API_PREFIX}/auth`,
        users: `${config.API_PREFIX}/users`,
        health: '/health',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Root route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SirtifAI Backend API',
    data: {
      version: config.API_VERSION,
      environment: config.NODE_ENV,
      documentation: '/api-docs',
      openApiSpec: '/api-docs/swagger.json',
      health: '/health',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
