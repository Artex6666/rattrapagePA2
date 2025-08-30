const express = require('express');
const { all, get, run } = require('../utils/db');
const { ensureAuth, ensureRole } = require('../utils/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await all('SELECT * FROM trucks WHERE active = 1');
  res.json(rows);
});

router.post('/', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const { name, franchiseeUserId, address, lat, lng } = req.body;
  const r = await run('INSERT INTO trucks (name, franchisee_user_id, address, lat, lng, active) VALUES (?, ?, ?, ?, ?, 1)', [name, franchiseeUserId || null, address || null, lat || null, lng || null]);
  res.status(201).json({ id: r.lastID });
});

router.put('/:id', ensureAuth, async (req, res) => {
  const t = await get('SELECT * FROM trucks WHERE id = ?', [req.params.id]);
  if (!t) return res.status(404).json({ error: 'Truck not found' });
  // Authorize admin or owner franchisee
  if (!(req.user.role === 'ADMIN' || (t.franchisee_user_id && t.franchisee_user_id === req.user.id))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, address, lat, lng, active } = req.body;
  await run('UPDATE trucks SET name = ?, address = ?, lat = ?, lng = ?, active = ? WHERE id = ?', [name || t.name, address || null, lat || null, lng || null, active != null ? (active ? 1 : 0) : t.active, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  await run('DELETE FROM trucks WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// Réserver un camion (assigner au franchisé connecté) si disponible
router.post('/:id/reserve', ensureAuth, async (req, res) => {
  try {
    const t = await get('SELECT * FROM trucks WHERE id = ?', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Camion introuvable' });
    // Uniquement un franchisé peut réserver
    if (!(req.user.role === 'franchisé' || req.user.role === 'ADMIN')) {
      return res.status(403).json({ error: 'Réservé aux franchisés' });
    }
    // Si déjà pris par quelqu'un d'autre
    if (t.franchisee_user_id && t.franchisee_user_id !== req.user.id) {
      return res.status(409).json({ error: 'Camion déjà réservé' });
    }
    await run('UPDATE trucks SET franchisee_user_id = ? WHERE id = ?', [req.user.id, req.params.id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Rendre un camion (libérer l’assignation)
router.post('/:id/release', ensureAuth, async (req, res) => {
  try {
    const t = await get('SELECT * FROM trucks WHERE id = ?', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Camion introuvable' });
    if (!(req.user.role === 'ADMIN' || (t.franchisee_user_id && t.franchisee_user_id === req.user.id))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await run('UPDATE trucks SET franchisee_user_id = NULL WHERE id = ?', [req.params.id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Mise à jour rapide de position (lat/lng)
router.post('/:id/location', ensureAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body || {};
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat/lng requis' });
    const t = await get('SELECT * FROM trucks WHERE id = ?', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Camion introuvable' });
    if (!(req.user.role === 'ADMIN' || (t.franchisee_user_id && t.franchisee_user_id === req.user.id))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await run('UPDATE trucks SET lat = ?, lng = ? WHERE id = ?', [lat, lng, req.params.id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;


