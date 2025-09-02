// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('sirtifai_db');

// Create application user
db.createUser({
  user: 'sirtifai_user',
  pwd: 'sirtifai_password',
  roles: [
    {
      role: 'readWrite',
      db: 'sirtifai_db'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password', 'role'],
      properties: {
        firstName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        lastName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 8
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'user', 'moderator']
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'inactive', 'suspended']
        }
      }
    }
  }
});

db.createCollection('tokens', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['token', 'userId', 'type', 'expiresAt'],
      properties: {
        token: {
          bsonType: 'string'
        },
        userId: {
          bsonType: 'objectId'
        },
        type: {
          bsonType: 'string',
          enum: ['access', 'refresh', 'reset_password', 'verify_email']
        },
        expiresAt: {
          bsonType: 'date'
        },
        isRevoked: {
          bsonType: 'bool'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ lastLogin: -1 });

db.tokens.createIndex({ token: 1 }, { unique: true });
db.tokens.createIndex({ userId: 1, type: 1 });
db.tokens.createIndex({ userId: 1, isRevoked: 1 });
db.tokens.createIndex({ type: 1, isRevoked: 1 });
db.tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create admin user
db.users.insertOne({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@sirtifai.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', // password: Admin123!
  role: 'admin',
  status: 'active',
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialization completed successfully!');
