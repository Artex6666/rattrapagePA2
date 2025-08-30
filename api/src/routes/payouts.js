const express = require('express');
const { run, all, get } = require('../utils/db');
const { ensureAuth, ensureRole } = require('../utils/auth');
const router = express.Router();

// Request payout by franchisee
router.post('/request', ensureAuth, async (req, res) => {
  const { amount_cents, iban } = req.body;
  if (!amount_cents || !iban) return res.status(400).json({ error: 'Montant et IBAN requis' });
  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (user.role !== 'franchisé' && user.role !== 'ADMIN') return res.status(403).json({ error: 'Réservé aux franchisés' });
  if (amount_cents > user.balance_cents) return res.status(400).json({ error: 'Solde insuffisant' });
  await run('INSERT INTO payouts (user_id, amount_cents, iban, status) VALUES (?, ?, ?, ?)', [req.user.id, amount_cents, iban, 'requested']);
  // Afficher popup côté front: simulé par réponse
  res.json({ ok: true, message: 'Virement confirmé (simulation)' });
});

router.get('/me', ensureAuth, async (req, res) => {
  const rows = await all('SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

// Admin view all
router.get('/', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const rows = await all('SELECT p.*, u.email FROM payouts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC');
  res.json(rows);
});

// Admin approve
router.post('/:id/approve', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const p = await get('SELECT * FROM payouts WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Demande introuvable' });
  await run('UPDATE payouts SET status = ? WHERE id = ?', ['approved', p.id]);
  await run('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?', [p.amount_cents, p.user_id]);
  res.json({ ok: true });
});

module.exports = router;


