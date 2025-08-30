const bcrypt = require('bcryptjs');
const { get, run } = require('../utils/db');

async function findUserByEmail(email) {
  return await get('SELECT * FROM users WHERE email = ?', [email]);
}

async function createUser({ email, passwordHash, firstName, lastName, role = 'client' }) {
  const r = await run('INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)', [
    email,
    passwordHash,
    firstName || null,
    lastName || null,
    role
  ]);
  return r.lastID;
}

async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}

module.exports = { findUserByEmail, createUser, hashPassword, verifyPassword };


