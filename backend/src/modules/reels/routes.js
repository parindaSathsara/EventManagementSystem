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
  validate({ query: schema.listReelsQuery }),
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
  validate({ body: schema.createReelBody }),
  asyncHandler(ctrl.create),
);
router.post(
  '/:id/react',
  requireAuth,
  validate({ params: schema.idParams, body: schema.reactBody }),
  asyncHandler(ctrl.react),
);
router.post(
  '/:id/save',
  requireAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.save),
);
router.post(
  '/:id/repost',
  requireAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.repost),
);

module.exports = router;
