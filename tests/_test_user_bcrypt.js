// Helper script to generate bcrypt hash for integration test user
const bcrypt = require('bcryptjs');
const password = 'TestUser123!';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});
