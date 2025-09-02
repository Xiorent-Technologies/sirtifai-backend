import request from 'supertest';
import app from '../app.js';

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app.getApp())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Service is healthy');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
    });

    it('should return memory usage information', async () => {
      const response = await request(app.getApp())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(response.body.data.memory).toHaveProperty('external');
      expect(typeof response.body.data.memory.used).toBe('number');
      expect(typeof response.body.data.memory.total).toBe('number');
    });

    it('should return CPU usage information', async () => {
      const response = await request(app.getApp())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.cpu).toHaveProperty('usage');
      expect(typeof response.body.data.cpu.usage).toBe('object');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app.getApp())
        .get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Health check completed');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('responseTime');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('system');
    });

    it('should return database service information', async () => {
      const response = await request(app.getApp())
        .get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.data.services).toHaveProperty('database');
      expect(response.body.data.services.database).toHaveProperty('status');
      expect(response.body.data.services.database).toHaveProperty('type');
      expect(response.body.data.services.database).toHaveProperty('responseTime');
    });

    it('should return system information', async () => {
      const response = await request(app.getApp())
        .get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.data.system).toHaveProperty('platform');
      expect(response.body.data.system).toHaveProperty('arch');
      expect(response.body.data.system).toHaveProperty('nodeVersion');
      expect(response.body.data.system).toHaveProperty('pid');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getApp())
        .get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application is ready');
      expect(response.body.data).toHaveProperty('status', 'ready');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getApp())
        .get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application is alive');
      expect(response.body.data).toHaveProperty('status', 'alive');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('pid');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return application metrics', async () => {
      const response = await request(app.getApp())
        .get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Metrics retrieved successfully');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data).toHaveProperty('environment');
    });

    it('should return memory metrics in bytes', async () => {
      const response = await request(app.getApp())
        .get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(response.body.data.memory).toHaveProperty('external');
      expect(response.body.data.memory).toHaveProperty('rss');
      expect(typeof response.body.data.memory.used).toBe('number');
      expect(typeof response.body.data.memory.total).toBe('number');
    });

    it('should return system metrics', async () => {
      const response = await request(app.getApp())
        .get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body.data.system).toHaveProperty('platform');
      expect(response.body.data.system).toHaveProperty('arch');
      expect(response.body.data.system).toHaveProperty('nodeVersion');
      expect(response.body.data.system).toHaveProperty('pid');
    });
  });
});
