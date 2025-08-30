const svc = require('../services/ordersService');

async function create(req, res){
  try {
    const { truckId, items, use_reward } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items requis' });
    const out = await svc.createOrder({ userId: req.user.id, truckId, items, useReward: use_reward });
    res.status(201).json({ ok:true, ...out });
  } catch(e){ res.status(500).json({ error: e.message }); }
}

async function my(req, res){ res.json(await svc.listMyOrders(req.user.id)); }

module.exports = { create, my };


