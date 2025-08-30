const express = require('express');
const { ensureAuth, ensureRole } = require('../utils/auth');
const ctrl = require('../controllers/incidentsController');
const router = express.Router();

router.post('/', ensureAuth, ctrl.create);

router.get('/', ensureAuth, ctrl.list);

router.put('/:id', ensureAuth, ctrl.update);

router.delete('/:id', ensureAuth, ensureRole('ADMIN'), ctrl.remove);

module.exports = router;


