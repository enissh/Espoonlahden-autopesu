const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/admin'); // Admin routes
const bookingRoutes = require('./routes/bookingRoutes'); // Booking routes
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Ensure the server runs on the correct port (default to 5000)

// CORS configuration
const allowedOrigins = [
  'https://premiumwash.onrender.com',
  'https://premiumwash-1.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json()); // Middleware to parse incoming JSON requests

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

