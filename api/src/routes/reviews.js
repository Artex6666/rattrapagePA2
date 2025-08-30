const express = require('express');
const { ensureAuth, ensureRole } = require('../utils/auth');
const ctrl = require('../controllers/reviewsController');
const router = express.Router();

router.get('/public', ctrl.getPublic);

router.post('/', ensureAuth, ctrl.submit);

router.get('/me', ensureAuth, ctrl.getMine);

router.get('/', ensureAuth, ensureRole('ADMIN'), ctrl.adminList);

router.post('/:id/approve', ensureAuth, ensureRole('ADMIN'), ctrl.approve);
router.post('/:id/reject', ensureAuth, ensureRole('ADMIN'), ctrl.reject);

router.delete('/:id', ensureAuth, ensureRole('ADMIN'), ctrl.remove);

module.exports = router;


