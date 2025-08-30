const { findUserByEmail, createUser, hashPassword, verifyPassword } = require('../services/authService');
const { signToken } = require('../utils/auth');
const config = require('../utils/config');

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });
    const passwordHash = await hashPassword(password);
    const id = await createUser({ email, passwordHash, firstName, lastName });
    return res.status(201).json({ id, email });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
    const token = signToken(user);
    const cookieOptions = { httpOnly: true, sameSite: 'lax' };
    if (config.isProd) {
      cookieOptions.secure = true;
      cookieOptions.domain = `.${config.baseDomain}`;
    }
    res.cookie('token', token, cookieOptions);
    
    // Retourner le token ET les informations de l'utilisateur (sans le mot de passe)
    const { password_hash, ...userWithoutPassword } = user;
    return res.json({ 
      token,
      user: userWithoutPassword
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function logout(req, res) {
  const cookieOptions = {};
  if (config.isProd) {
    cookieOptions.domain = `.${config.baseDomain}`;
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
  }
  res.clearCookie('token', cookieOptions);
  return res.json({ ok: true });
}

module.exports = { register, login, logout };


