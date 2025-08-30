const express = require('express');
const { all, get, run } = require('../utils/db');
const { ensureAuth, ensureRole } = require('../utils/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await all('SELECT * FROM warehouses ORDER BY id');
  res.json(rows);
});

router.post('/', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const { name, address, lat, lng } = req.body;
  const r = await run('INSERT INTO warehouses (name, address, lat, lng) VALUES (?, ?, ?, ?)', [name, address || null, lat || null, lng || null]);
  res.status(201).json({ id: r.lastID });
});

router.put('/:id', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const { name, address, lat, lng } = req.body;
  await run('UPDATE warehouses SET name = ?, address = ?, lat = ?, lng = ? WHERE id = ?', [name, address || null, lat || null, lng || null, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  await run('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;


