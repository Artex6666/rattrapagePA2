const express = require('express');
const { all } = require('../utils/db');
const router = express.Router();

router.get('/public', async (req, res) => {
  const trucks = await all('SELECT id, name, lat, lng FROM trucks WHERE active = 1 AND lat IS NOT NULL AND lng IS NOT NULL');
  res.json({ trucks });
});

router.get('/franchise', async (req, res) => {
  const trucks = await all('SELECT id, name, lat, lng, franchisee_user_id FROM trucks WHERE lat IS NOT NULL AND lng IS NOT NULL');
  const warehouses = await all('SELECT id, name, lat, lng FROM warehouses WHERE lat IS NOT NULL AND lng IS NOT NULL');
  res.json({ trucks, warehouses });
});

module.exports = router;


