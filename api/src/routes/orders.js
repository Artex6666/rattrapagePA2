const express = require('express');
const { ensureAuth } = require('../utils/auth');
const ctrl = require('../controllers/ordersController');
const router = express.Router();

router.post('/', ensureAuth, ctrl.create);
router.get('/me', ensureAuth, ctrl.my);
// Franchisé: lister les commandes relatives à ses camions
router.get('/franchise/me', ensureAuth, async (req, res) => {
  try {
    const { all } = require('../utils/db');
    // Commandes des camions dont il est franchisee_user_id
    const rows = await all(`
      SELECT o.* FROM orders o
      JOIN trucks t ON t.id = o.truck_id
      WHERE t.franchisee_user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mettre à jour le statut d'une commande (franchisé propriétaire ou admin)
router.put('/:id/status', ensureAuth, async (req, res) => {
  try {
    const { get, run } = require('../utils/db');
    const o = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!o) return res.status(404).json({ error: 'Commande introuvable' });
    let truck = null;
    if (o.truck_id) truck = await get('SELECT * FROM trucks WHERE id = ?', [o.truck_id]);
    if (!(req.user.role === 'ADMIN' || (truck && truck.franchisee_user_id === req.user.id))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = ['pending', 'ready', 'completed'];
    const next = String(req.body.status || '').toLowerCase();
    if (!allowed.includes(next)) return res.status(400).json({ error: 'Statut invalide' });
    await run('UPDATE orders SET status = ? WHERE id = ?', [next, req.params.id]);
    // Transférer 20% au franchisé à la complétion
    if (next === 'completed' && truck && truck.franchisee_user_id) {
      const franchiseeId = truck.franchisee_user_id;
      const admin = await get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
      const amountFranchisee = Math.floor((o.total_cents || 0) * 0.20);
      if (admin && admin.id && amountFranchisee > 0) {
        await run('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?', [amountFranchisee, admin.id]);
        await run('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', [amountFranchisee, franchiseeId]);
      }
    }
    // TODO: envoyer un mail lorsque le statut passe à ready
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;


