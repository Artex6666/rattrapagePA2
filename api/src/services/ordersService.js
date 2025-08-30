const { run, get, all } = require('../utils/db');

async function getLoyaltyConfig() {
  return await get('SELECT * FROM loyalty_config WHERE id = 1');
}

async function createOrder({ userId, truckId, items, useReward }) {
  const totalCents = items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
  const cfg = await getLoyaltyConfig();
  const pointsPerUnit = cfg.points_per_spend_unit;
  const unitEuro = cfg.spend_unit_euro;
  const earned = Math.floor((totalCents / 100) / unitEuro) * pointsPerUnit;

  let usedReward = 0;
  if (useReward) {
    const me = await get('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
    if (me && me.loyalty_points >= cfg.reward_threshold_points) {
      usedReward = 1;
      await run('UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?', [cfg.reward_threshold_points, userId]);
    }
  }

  // Enregistrer la commande
  await run(
    'INSERT INTO orders (user_id, truck_id, items_json, total_cents, used_reward, loyalty_points_earned) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, truckId || null, JSON.stringify(items), totalCents, usedReward, earned]
  );

  // Crédits de fidélité pour le client (pas de crédit monétaire au client)
  await run('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [earned, userId]);

  // Répartition 20/80
  // Trouver l'admin
  let admin = await get('SELECT id FROM users WHERE email = ? LIMIT 1', ['admin@admin.com']);
  if (!admin) {
    // fallback: premier ADMIN
    admin = await get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
  }

  // Trouver le franchisé du camion si fourni
  let franchisee = null;
  if (truckId) {
    franchisee = await get('SELECT franchisee_user_id FROM trucks WHERE id = ?', [truckId]);
  }

  const MENU_STANDARD_PRICE_CENTS = 1500; // 15€
  const franchiseeMinBonusCents = usedReward ? Math.floor(MENU_STANDARD_PRICE_CENTS * 0.20) : 0; // 3€ si menu offert
  const splitFranchiseeCents = Math.max(Math.floor(totalCents * 0.20), franchiseeMinBonusCents);
  const splitAdminCents = Math.floor(totalCents * 0.80);

  // Créditer le franchisé si connu
  if (franchisee && franchisee.franchisee_user_id) {
    await run('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', [splitFranchiseeCents, franchisee.franchisee_user_id]);
  }
  // Créditer l'admin
  if (admin && admin.id) {
    await run('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', [splitAdminCents, admin.id]);
  }

  return { total_cents: totalCents, points_earned: earned, used_reward: usedReward };
}

async function listMyOrders(userId) {
  const rows = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
}

module.exports = { createOrder, listMyOrders };


