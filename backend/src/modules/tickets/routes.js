const { Router } = require('express');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { requireAuth, optionalAuth } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

// Guest-capable reservation — browse + book without an account. A logged-in
// user reserving here just uses their account. Must come before the global
// requireAuth below.
router.post(
  '/reserve',
  optionalAuth,
  validate({ body: schema.reserveBody }),
  asyncHandler(ctrl.reserve),
);

// Everything else is user-owned and requires auth.
router.use(requireAuth);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', validate({ params: schema.idParams }), asyncHandler(ctrl.getOne));
router.post('/', validate({ body: schema.purchaseBody }), asyncHandler(ctrl.purchase));
router.patch(
  '/:id/status',
  validate({ params: schema.idParams, body: schema.updateStatusBody }),
  asyncHandler(ctrl.updateStatus),
);

module.exports = router;
