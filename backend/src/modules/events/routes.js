const { Router } = require('express');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { requireAuth, optionalAuth } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

router.get(
  '/',
  optionalAuth,
  validate({ query: schema.listEventsQuery }),
  asyncHandler(ctrl.list),
);
router.get(
  '/:id',
  optionalAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.getOne),
);
router.post(
  '/',
  requireAuth,
  validate({ body: schema.createEventBody }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requireAuth,
  validate({ params: schema.idParams, body: schema.updateEventBody }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requireAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.remove),
);

// Toggle save / unsave (idempotent-ish — returns current state).
router.post(
  '/:id/save',
  requireAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.save),
);

module.exports = router;
