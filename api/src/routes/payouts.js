const express = require('express');
const { run, all, get } = require('../utils/db');
const { ensureAuth, ensureRole } = require('../utils/auth');
const router = express.Router();

// Request payout by franchisee
router.post('/request', ensureAuth, async (req, res) => {
  try {
    const { amount_cents, iban } = req.body;
    if (!amount_cents || !iban) return res.status(400).json({ error: 'Montant et IBAN requis' });
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (user.role !== 'franchisé' && user.role !== 'ADMIN') return res.status(403).json({ error: 'Réservé aux franchisés' });
    // Calculer le total des retraits en attente (requested + approved non done)
    const pending = await get("SELECT COALESCE(SUM(amount_cents),0) as s FROM payouts WHERE user_id = ? AND status IN ('requested','approved')", [req.user.id]);
    const pendingCents = pending?.s || 0;
    const availableCents = Math.max(0, (user.balance_cents || 0) - pendingCents);
    if (amount_cents > availableCents) return res.status(400).json({ error: 'Montant supérieur au solde disponible' });
    await run('INSERT INTO payouts (user_id, amount_cents, iban, status) VALUES (?, ?, ?, ?)', [req.user.id, amount_cents, iban, 'requested']);
    res.json({ ok: true, message: 'Demande de retrait enregistrée', available_cents: availableCents - amount_cents });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', ensureAuth, async (req, res) => {
  const rows = await all('SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

// Admin view all
router.get('/', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const rows = await all('SELECT p.*, u.email, u.role FROM payouts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC');
  res.json(rows);
});

// Admin approve
router.post('/:id/approve', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const p = await get('SELECT * FROM payouts WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Demande introuvable' });
  await run('UPDATE payouts SET status = ? WHERE id = ?', ['approved', p.id]);
  // Débiter le solde à l'approbation
  await run('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?', [p.amount_cents, p.user_id]);
  res.json({ ok: true });
});

// Admin reject
router.post('/:id/reject', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const p = await get('SELECT * FROM payouts WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Demande introuvable' });
  await run('UPDATE payouts SET status = ? WHERE id = ?', ['rejected', p.id]);
  res.json({ ok: true });
});

// Admin set done (effectué)
router.post('/:id/done', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const p = await get('SELECT * FROM payouts WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Demande introuvable' });
  await run('UPDATE payouts SET status = ? WHERE id = ?', ['done', p.id]);
  res.json({ ok: true });
});

// PDF exports
router.get('/me/pdf', ensureAuth, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const rows = await all('SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payouts.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('Historique des virements', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    rows.forEach(r => {
      doc.text(`#${r.id}  |  ${new Date(r.created_at).toLocaleString('fr-FR')}  |  ${(r.amount_cents/100).toFixed(2)}€  |  ${r.status}  |  IBAN: ${r.iban}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PDF export global (ADMIN)
router.get('/pdf', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const rows = await all('SELECT p.*, u.email, u.role FROM payouts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payouts_all.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('Historique des virements (Global)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    rows.forEach(r => {
      doc.text(`#${r.id}  |  ${new Date(r.created_at).toLocaleString('fr-FR')}  |  ${(r.amount_cents/100).toFixed(2)}€  |  ${r.status}  |  ${r.role}  |  ${r.email}  |  IBAN: ${r.iban}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;


