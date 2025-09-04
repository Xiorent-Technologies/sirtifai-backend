import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import paymentController from './controllers/paymentController.js';
import invoiceController from './controllers/invoiceController.js';
import adminController from './controllers/adminController.js';

import { uploadSingle, uploadMultiple } from './middleware/upload.js';

/**
 * Express application setup
 * Minimal app configuration
 */

const app = express();
console.log("Hello World");
// Connect to database (non-blocking)
connectDB().catch(console.error);

// Middleware
app.use(express.json({ limit: '5mb' })); // or '10mb', adjust as needed
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(cors());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/v1/payments', paymentController);
app.use('/api/v1/invoices', invoiceController);
app.use('/api/v1/admin', adminController);

// File upload routes
app.post('/api/v1/upload/single', uploadSingle, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    }
  });
});

app.post('/api/v1/upload/multiple', uploadMultiple, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  const files = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    path: `/uploads/${file.filename}`
  }));
  
  res.json({
    success: true,
    message: 'Files uploaded successfully',
    data: files
  });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SirtifAI Backend API',
    version: '1.0.0',
    endpoints: {
      payments: '/api/v1/payments',
      invoices: '/api/v1/invoices',
      upload: {
        single: '/api/v1/upload/single',
        multiple: '/api/v1/upload/multiple'
      },
      health: '/health'
    }
  });
});

export default app;
