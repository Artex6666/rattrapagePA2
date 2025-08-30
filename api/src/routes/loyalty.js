const express = require('express');
const { get, run, all } = require('../utils/db');
const { ensureAuth, ensureRole } = require('../utils/auth');
const router = express.Router();

router.get('/config', async (req, res) => {
  const cfg = await get('SELECT * FROM loyalty_config WHERE id = 1');
  res.json(cfg);
});

router.put('/config', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const { points_per_spend_unit, spend_unit_euro, reward_threshold_points, reward_free_menus } = req.body;
  await run('UPDATE loyalty_config SET points_per_spend_unit = ?, spend_unit_euro = ?, reward_threshold_points = ?, reward_free_menus = ? WHERE id = 1', [
    points_per_spend_unit,
    spend_unit_euro,
    reward_threshold_points,
    reward_free_menus
  ]);
  res.json({ ok: true });
});

// Liste des utilisateurs avec points de fidélité
router.get('/users', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let rows = await all('SELECT id, email, first_name, last_name, loyalty_points FROM users ORDER BY created_at DESC');
  if (q) {
    rows = rows.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q)
    );
  }
  res.json(rows);
});

// Modifier les points (delta peut être négatif)
router.post('/users/:id/points', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const userId = req.params.id;
  const { delta } = req.body;
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return res.status(400).json({ error: 'delta invalide' });
  const u = await get('SELECT id, loyalty_points FROM users WHERE id = ?', [userId]);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const next = Math.max(0, Number(u.loyalty_points || 0) + n);
  await run('UPDATE users SET loyalty_points = ? WHERE id = ?', [next, userId]);
  res.json({ ok: true, loyalty_points: next });
});

module.exports = router;


