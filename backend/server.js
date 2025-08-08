const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/admin'); // Admin routes
const bookingRoutes = require('./routes/bookingRoutes'); // Booking routes
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Ensure the server runs on the correct port (default to 5000)

// Ultra-simple CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://espoonlahden-autopesu.netlify.app'
];

console.log('Allowed CORS origins:', allowedOrigins);

// Basic CORS configuration without complex path matching
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Simple origin check
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.warn('CORS: Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Middleware
app.use(express.json()); // Middleware to parse incoming JSON requests

// Apply CORS middleware with error handling
app.use((req, res, next) => {
  cors(corsOptions)(req, res, next);
});

// Simple preflight handler
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.status(200).end();
});

// MongoDB connection with updated options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Authentication middleware
const authMiddleware = require('./middleware/auth');

// Use routes
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/bookings', bookingRoutes); // Booking routes

// Protected route test
app.get('/api/admin/test', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route accessed successfully' });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

