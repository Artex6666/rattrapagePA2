const express = require('express');
const { ensureAuth } = require('../utils/auth');
const ctrl = require('../controllers/ordersController');
const router = express.Router();

router.post('/', ensureAuth, ctrl.create);
router.get('/me', ensureAuth, ctrl.my);

module.exports = router;


