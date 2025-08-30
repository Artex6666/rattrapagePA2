const { run, get, all } = require('../utils/db');

async function getLoyaltyConfig() {
  return await get('SELECT * FROM loyalty_config WHERE id = 1');
}

async function createOrder({ userId, truckId, items, useReward, menuPack, menuPackQty }) {
  let totalCents = items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
  // Appliquer l'offre menu 15€: remplacer N trios plat+boisson+dessert par N*1500
  const triosRequested = Number(menuPackQty || (menuPack ? 1 : 0)) || 0;
  if (triosRequested > 0) {
    const MENU_STANDARD_PRICE_CENTS = 1500;
    const isDrink = (name) => String(name || '').toLowerCase().startsWith('boisson');
    const isDessert = (name) => String(name || '').toLowerCase().includes('dessert');
    const dishItem = items.find(it => it.qty > 0 && !isDrink(it.name) && !isDessert(it.name));
    const drinkItem = items.find(it => it.qty > 0 && isDrink(it.name));
    const dessertItem = items.find(it => it.qty > 0 && isDessert(it.name));
    if (dishItem && drinkItem && dessertItem) {
      const effectiveTrios = Math.max(0, Math.min(triosRequested, Number(dishItem.qty)||0, Number(drinkItem.qty)||0, Number(dessertItem.qty)||0));
      if (effectiveTrios > 0) {
        const oneTrioPrice = (dishItem.price_cents || 0) + (drinkItem.price_cents || 0) + (dessertItem.price_cents || 0);
        totalCents = totalCents - (oneTrioPrice * effectiveTrios) + (MENU_STANDARD_PRICE_CENTS * effectiveTrios);
      }
    }
  }
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

  // Crédit 100% à l'admin à la création; transfert 20% vers franchisé à la complétion
  let admin = await get('SELECT id FROM users WHERE email = ? LIMIT 1', ['admin@admin.com']);
  if (!admin) admin = await get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
  if (admin && admin.id) {
    await run('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', [totalCents, admin.id]);
  }

  return { total_cents: totalCents, points_earned: earned, used_reward: usedReward };
}

async function listMyOrders(userId) {
  const rows = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
}

module.exports = { createOrder, listMyOrders };


