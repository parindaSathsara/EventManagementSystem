const { Router } = require('express');
const asyncHandler = require('../../lib/async-handler');
const { optionalAuth } = require('../../middleware/auth');
const ctrl = require('./controller');

const router = Router();

// Guest-readable reminder feed (events 1–2 days out).
router.get('/', optionalAuth, asyncHandler(ctrl.list));

module.exports = router;
