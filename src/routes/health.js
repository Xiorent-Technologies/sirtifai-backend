import express from 'express';
import healthController from '../controllers/healthController.js';

const router = express.Router();

/**
 * Health check routes
 * Provides various health check endpoints for monitoring and load balancing
 */

// Basic health check
router.get('/', healthController.health);

// Detailed health check with database connectivity
router.get('/detailed', healthController.healthDetailed);

// Kubernetes/Docker health checks
router.get('/ready', healthController.readiness);
router.get('/live', healthController.liveness);

// Metrics endpoint
router.get('/metrics', healthController.metrics);

export default router;
