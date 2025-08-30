const express = require('express');
const { ensureAuth, ensureRole } = require('../utils/auth');
const ctrl = require('../controllers/newsletterController');
const router = express.Router();

router.get('/campaigns', ensureAuth, ensureRole('ADMIN'), ctrl.list);
router.post('/campaigns', ensureAuth, ensureRole('ADMIN'), ctrl.create);
router.post('/campaigns/:id/send', ensureAuth, ensureRole('ADMIN'), ctrl.sendNow);
router.put('/campaigns/:id/schedule', ensureAuth, ensureRole('ADMIN'), ctrl.schedule);

module.exports = router;


