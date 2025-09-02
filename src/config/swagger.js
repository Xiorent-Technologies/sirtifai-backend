import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

/**
 * Swagger configuration
 * API documentation setup using OpenAPI 3.0
 */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SirtifAI Backend API',
      version: '1.0.0',
      description: 'Production-ready Node.js + Express backend with authentication, validation, and scalable architecture',
      contact: {
        name: 'SirtifAI Team',
        email: 'support@sirtifai.com',
        url: 'https://sirtifai.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://${config.HOST}:${config.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.sirtifai.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            firstName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User first name',
              example: 'John',
            },
            lastName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User last name',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator'],
              description: 'User role',
              example: 'user',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'User status',
              example: 'active',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+1234567890',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'User date of birth',
              example: '1990-01-01',
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
              example: 'https://via.placeholder.com/150x150?text=User',
            },
            bio: {
              type: 'string',
              maxLength: 500,
              description: 'User bio',
              example: 'Software developer passionate about technology',
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'User website URL',
              example: 'https://johndoe.com',
            },
            location: {
              type: 'string',
              maxLength: 100,
              description: 'User location',
              example: 'New York, NY',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status',
              example: true,
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              example: '2023-12-01T10:30:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-11-01T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-12-01T10:30:00Z',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            expiresIn: {
              type: 'string',
              description: 'Token expiration time',
              example: '7d',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            tokens: {
              $ref: '#/components/schemas/AuthTokens',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'email',
                      },
                      message: {
                        type: 'string',
                        example: 'Email is required',
                      },
                    },
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:30:00Z',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            meta: {
              type: 'object',
              description: 'Additional metadata',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      example: 1,
                    },
                    limit: {
                      type: 'integer',
                      example: 10,
                    },
                    total: {
                      type: 'integer',
                      example: 100,
                    },
                    pages: {
                      type: 'integer',
                      example: 10,
                    },
                    hasNext: {
                      type: 'boolean',
                      example: true,
                    },
                    hasPrev: {
                      type: 'boolean',
                      example: false,
                    },
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:30:00Z',
            },
          },
        },
        PaginationQuery: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number',
              example: 1,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10,
              description: 'Items per page',
              example: 10,
            },
            sort: {
              type: 'string',
              description: 'Sort field',
              example: 'createdAt',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
              description: 'Sort order',
              example: 'desc',
            },
          },
        },
        SearchQuery: {
          allOf: [
            { $ref: '#/components/schemas/PaginationQuery' },
            {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Search query',
                  example: 'john',
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'user', 'moderator'],
                  description: 'Filter by role',
                  example: 'user',
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'suspended'],
                  description: 'Filter by status',
                  example: 'active',
                },
                isEmailVerified: {
                  type: 'boolean',
                  description: 'Filter by email verification status',
                  example: true,
                },
              },
            },
          ],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Unauthorized access',
                error: {
                  code: 'UNAUTHORIZED',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Access forbidden',
                error: {
                  code: 'FORBIDDEN',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: [
                    {
                      field: 'email',
                      message: 'Email is required',
                    },
                  ],
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        ConflictError: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'User with this email already exists',
                error: {
                  code: 'CONFLICT',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: {
                  code: 'INTERNAL_ERROR',
                },
                timestamp: '2023-12-01T10:30:00Z',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
