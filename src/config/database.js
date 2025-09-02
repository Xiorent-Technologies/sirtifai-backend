import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { config } from './index.js';
import logger from '../utils/logger.js';

/**
 * Database configuration and connection management
 * Supports both MongoDB (Mongoose) and PostgreSQL (Sequelize)
 */

class DatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.sequelizeConnection = null;
  }

  /**
   * Connect to MongoDB using Mongoose
   */
  async connectMongoDB() {
    try {
      const mongoUri = config.NODE_ENV === 'test' 
        ? config.MONGODB_TEST_URI 
        : config.MONGODB_URI;

      this.mongoConnection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return this.mongoConnection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to PostgreSQL using Sequelize
   */
  async connectPostgreSQL() {
    try {
      const dbConfig = {
        host: config.DB_HOST,
        port: config.DB_PORT,
        database: config.NODE_ENV === 'test' ? config.DB_TEST_NAME : config.DB_NAME,
        username: config.DB_USER,
        password: config.DB_PASSWORD,
        dialect: 'postgres',
        logging: config.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      };

      this.sequelizeConnection = new Sequelize(dbConfig);
      
      await this.sequelizeConnection.authenticate();
      logger.info('PostgreSQL connected successfully');

      return this.sequelizeConnection;
    } catch (error) {
      logger.error('PostgreSQL connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to the configured database
   */
  async connect() {
    try {
      if (config.DATABASE_TYPE === 'mongodb') {
        return await this.connectMongoDB();
      } else if (config.DATABASE_TYPE === 'postgresql') {
        return await this.connectPostgreSQL();
      } else {
        throw new Error('Invalid DATABASE_TYPE. Must be "mongodb" or "postgresql"');
      }
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      }
      
      if (this.sequelizeConnection) {
        await this.sequelizeConnection.close();
        logger.info('PostgreSQL disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Get the active database connection
   */
  getConnection() {
    if (config.DATABASE_TYPE === 'mongodb') {
      return this.mongoConnection;
    } else if (config.DATABASE_TYPE === 'postgresql') {
      return this.sequelizeConnection;
    }
    return null;
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

export default databaseManager;
