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
  validate({ query: schema.listArtistsQuery }),
  asyncHandler(ctrl.list),
);
// `/me` must come BEFORE `/:id` so the literal route wins.
router.get('/me', requireAuth, asyncHandler(ctrl.getMine));
router.get(
  '/:id',
  optionalAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.getOne),
);
router.post(
  '/become',
  requireAuth,
  validate({ body: schema.becomeArtistBody }),
  asyncHandler(ctrl.become),
);
router.patch(
  '/me',
  requireAuth,
  validate({ body: schema.updateArtistBody }),
  asyncHandler(ctrl.updateMine),
);
router.post(
  '/:id/follow',
  requireAuth,
  validate({ params: schema.idParams }),
  asyncHandler(ctrl.follow),
);

module.exports = router;
