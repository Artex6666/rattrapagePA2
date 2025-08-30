const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('./config');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function ensureAuth(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function ensureRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { signToken, ensureAuth, ensureRole };


