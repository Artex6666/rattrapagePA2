const express = require('express');
const { ensureAuth, ensureRole } = require('../utils/auth');
const ctrl = require('../controllers/usersController');
const { all, get, run } = require('../utils/db');
const router = express.Router();

router.get('/me', ensureAuth, ctrl.me);
router.put('/me', ensureAuth, ctrl.update);

// CRUD admin
router.get('/', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const rows = await all('SELECT id, email, first_name, last_name, phone, role, is_validated, loyalty_points, balance_cents, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const u = await get('SELECT id, email, first_name, last_name, phone, role, is_validated, loyalty_points, balance_cents, created_at FROM users WHERE id = ?', [req.params.id]);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

router.post('/:id/role', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'role requis' });
  await run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/validate', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  await run('UPDATE users SET is_validated = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/recheck', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  await run('UPDATE users SET is_validated = 0 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  await run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;


