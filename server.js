#!/usr/bin/env node

/**
 * Server entry point
 * Minimal server startup
 */

import dotenv from 'dotenv';
import app from './src/app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('Starting server...');
    // Start the Express server
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
