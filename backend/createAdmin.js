const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Correct path to your Admin model

mongoose.connect('mongodb://localhost:27017/carwash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const email = 'enisshabani71@gmail.com'; // Admin email
  const password = 'admin123'; // Plain password
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new Admin instance with the hashed password
  const admin = new Admin({
    email, // Use email as the unique identifier
    password: hashedPassword, // Store the hashed password
  });

  // Save the admin to the database
  await admin.save();
  console.log('Admin user created with hashed password');
  
  // Disconnect from MongoDB
  mongoose.disconnect();
}).catch(err => {
  console.error('Error creating admin:', err);
});
