# SirtifAI Backend

A production-ready Node.js + Express backend with authentication, validation, and scalable architecture.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database Support**: MongoDB (Mongoose) and PostgreSQL (Sequelize) support
- **Validation**: Request validation using Joi
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Testing**: Jest + Supertest with comprehensive test coverage
- **Documentation**: Swagger/OpenAPI documentation
- **Docker**: Multi-stage Docker builds with docker-compose
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Logging**: Winston logger with structured logging
- **Error Handling**: Centralized error handling with custom error classes
- **Email Service**: Nodemailer integration for transactional emails

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── index.js      # Main config
│   ├── database.js   # Database connection
│   ├── constants.js  # Application constants
│   └── swagger.js    # Swagger configuration
├── controllers/      # Request handlers
│   ├── authController.js
│   ├── userController.js
│   └── healthController.js
├── middlewares/      # Express middlewares
│   ├── auth.js       # Authentication middleware
│   ├── validation.js # Request validation
│   ├── security.js   # Security middleware
│   └── error.js      # Error handling
├── models/           # Database models
│   ├── User.js       # User model (MongoDB)
│   ├── Token.js      # Token model (MongoDB)
│   └── sequelize/    # PostgreSQL models
├── routes/           # Route definitions
│   ├── auth.js       # Authentication routes
│   ├── users.js      # User management routes
│   ├── health.js     # Health check routes
│   ├── docs.js       # API documentation
│   └── index.js      # Main router
├── services/         # Business logic
│   ├── authService.js
│   ├── userService.js
│   └── emailService.js
├── tests/            # Test files
│   ├── setup.js      # Test setup
│   ├── auth.test.js
│   ├── users.test.js
│   └── health.test.js
├── utils/            # Utility functions
│   ├── logger.js     # Winston logger
│   ├── response.js   # Response formatters
│   ├── errors.js     # Custom error classes
│   └── helpers.js    # Helper functions
└── app.js            # Express app configuration
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- MongoDB or PostgreSQL
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sirtifai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Docker Development

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f app
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DATABASE_TYPE=mongodb  # or postgresql
MONGODB_URI=mongodb://localhost:27017/sirtifai_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sirtifai_db
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@sirtifai.com
```

## 📚 API Documentation

### Swagger UI
- **Development**: http://localhost:3000/api-docs
- **Production**: https://your-domain.com/api-docs

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

#### User Management (Admin)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/suspend` - Suspend user
- `PATCH /api/v1/users/:id/activate` - Activate user

#### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API endpoints and database interactions
- **Coverage**: Minimum 70% code coverage required

## 🚀 Deployment

### Docker Production

1. **Build and run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Environment setup for production**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export JWT_SECRET=your-production-secret
   # ... other variables
   ```

### Manual Deployment

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start application**
   ```bash
   pm2 start server.js --name sirtifai-backend
   ```

3. **Setup PM2 startup**
   ```bash
   pm2 startup
   pm2 save
   ```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js security headers
- **Request Size Limiting**: Prevent large payload attacks

## 📊 Monitoring

### Health Checks
- **Basic**: `/health` - Application status
- **Detailed**: `/health/detailed` - Database connectivity and system metrics
- **Readiness**: `/health/ready` - Kubernetes readiness probe
- **Liveness**: `/health/live` - Kubernetes liveness probe

### Logging
- **Structured Logging**: JSON format with Winston
- **Log Levels**: error, warn, info, debug
- **Request Logging**: Morgan HTTP request logger
- **Security Events**: Authentication and authorization events

## 🛠️ Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Git Hooks
- **Pre-commit**: Run linting and formatting
- **Pre-push**: Run tests
- **Commit-msg**: Validate commit message format

### Commit Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
Example: feat(auth): add JWT authentication
```

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format code with Prettier
npm run format:check # Check code formatting
npm run docker:build # Build Docker image
npm run docker:run   # Run with docker-compose
npm run docker:stop  # Stop docker-compose
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@sirtifai.com or create an issue in the repository.

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- MongoDB and PostgreSQL communities
- All open-source contributors
