import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database connection setup
 * MongoDB connection using Mongoose
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirtifai_db';

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    // Set connection timeout to 5 seconds
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.log('📝 Server will continue without database connection');
    console.log('💡 To fix: Start MongoDB or update MONGODB_URI in .env file');
  }
}

export default connectDB;
