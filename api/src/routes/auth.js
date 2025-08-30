const express = require('express');
const { ensureAuth } = require('../utils/auth');
const { register, login, logout } = require('../controllers/authController');
const { get } = require('../utils/db');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', ensureAuth, async (req, res) => {
  const user = await get('SELECT id, email, first_name, last_name, role, balance_cents, loyalty_points FROM users WHERE id = ?', [req.user.id]);
  return res.json({ user });
});

module.exports = router;


