import { successResponse, healthResponse } from '../utils/response.js';
import { config } from '../config/index.js';
import databaseManager from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Health check controller
 * Provides health check endpoints for monitoring
 */

class HealthController {
  /**
   * Basic health check
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  health = (req, res, next) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };

    return healthResponse(res, healthData);
  };

  /**
   * Detailed health check with database connectivity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  healthDetailed = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Check database connectivity
      let databaseStatus = 'unknown';
      let databaseResponseTime = 0;
      
      try {
        const dbStartTime = Date.now();
        const connection = databaseManager.getConnection();
        
        if (config.DATABASE_TYPE === 'mongodb') {
          // Ping MongoDB
          await connection.db.admin().ping();
        } else if (config.DATABASE_TYPE === 'postgresql') {
          // Test PostgreSQL connection
          await connection.authenticate();
        }
        
        databaseResponseTime = Date.now() - dbStartTime;
        databaseStatus = 'connected';
      } catch (dbError) {
        databaseStatus = 'disconnected';
        logger.error('Database health check failed', { error: dbError.message });
      }

      const totalResponseTime = Date.now() - startTime;

      const healthData = {
        status: databaseStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        responseTime: `${totalResponseTime}ms`,
        services: {
          database: {
            status: databaseStatus,
            type: config.DATABASE_TYPE,
            responseTime: `${databaseResponseTime}ms`,
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          pid: process.pid,
        },
      };

      const statusCode = healthData.status === 'healthy' ? 200 : 503;
      return res.status(statusCode).json({
        success: true,
        message: 'Health check completed',
        data: healthData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      return res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Readiness probe
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  readiness = async (req, res, next) => {
    try {
      // Check if application is ready to serve traffic
      const connection = databaseManager.getConnection();
      
      if (!connection) {
        return res.status(503).json({
          success: false,
          message: 'Application not ready',
          error: {
            code: 'NOT_READY',
            message: 'Database connection not established',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Test database connection
      if (config.DATABASE_TYPE === 'mongodb') {
        await connection.db.admin().ping();
      } else if (config.DATABASE_TYPE === 'postgresql') {
        await connection.authenticate();
      }

      return res.status(200).json({
        success: true,
        message: 'Application is ready',
        data: {
          status: 'ready',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Readiness check failed', { error: error.message });
      
      return res.status(503).json({
        success: false,
        message: 'Application not ready',
        error: {
          code: 'NOT_READY',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Liveness probe
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  liveness = (req, res, next) => {
    // Simple liveness check - if the process is running, it's alive
    return res.status(200).json({
      success: true,
      message: 'Application is alive',
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
      },
    });
  };

  /**
   * Metrics endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  metrics = (req, res, next) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      cpu: process.cpuUsage(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
      environment: config.NODE_ENV,
    };

    return res.status(200).json({
      success: true,
      message: 'Metrics retrieved successfully',
      data: metrics,
    });
  };
}

export default new HealthController();
