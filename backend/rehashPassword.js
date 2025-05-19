const bcrypt = require('bcryptjs');

// Rehash the password "admin123"
const hashedPassword = bcrypt.hashSync('admin123', 10);

console.log('Hashed Password:', hashedPassword);

