const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (err) {
    console.error(err);
    throw new Error('Error hashing password');
  }
}

async function comparePasswords(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    console.error(err);
    throw new Error('Error comparing passwords');
  }
}

module.exports = { hashPassword, comparePasswords };