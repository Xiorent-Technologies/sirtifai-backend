import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * API Documentation routes
 * Swagger UI and OpenAPI documentation
 */

// Swagger UI options
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'SirtifAI Backend API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Serve raw OpenAPI spec
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API documentation info
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation Information',
    data: {
      title: swaggerSpec.info.title,
      version: swaggerSpec.info.version,
      description: swaggerSpec.info.description,
      contact: swaggerSpec.info.contact,
      license: swaggerSpec.info.license,
      servers: swaggerSpec.servers,
      swaggerUi: '/api-docs',
      openApiSpec: '/api-docs/swagger.json',
      environment: config.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
