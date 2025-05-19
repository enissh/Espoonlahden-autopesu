const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  
  // Check if no auth header
  if (!authHeader) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }

  try {
    // Verify token
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'premiumwash_secure_jwt_secret_key_2024_enissh_carwash');
    
    // Add admin to request
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
