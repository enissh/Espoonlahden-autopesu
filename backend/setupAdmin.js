const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if admin exists
    const adminExists = await Admin.findOne({});
    if (adminExists) {
      console.log('Admin already exists');
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'admin123',
      10
    );

    const admin = new Admin({
      email: process.env.ADMIN_EMAIL || 'enisshabani71@gmail.com',
      password: hashedPassword
    });

    await admin.save();
    console.log('Admin created successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error setting up admin:', err);
    process.exit(1);
  }
};

setupAdmin(); 