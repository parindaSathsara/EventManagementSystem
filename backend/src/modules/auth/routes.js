const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

// Stricter limiter on auth endpoints to slow credential stuffing without
// affecting normal API usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router.post(
  '/signup',
  authLimiter,
  validate({ body: schema.signupBody }),
  asyncHandler(ctrl.signup),
);
router.post(
  '/login',
  authLimiter,
  validate({ body: schema.loginBody }),
  asyncHandler(ctrl.login),
);
router.get('/me', requireAuth, asyncHandler(ctrl.me));
router.patch(
  '/complete-profile',
  requireAuth,
  validate({ body: schema.completeProfileBody }),
  asyncHandler(ctrl.completeProfile),
);

module.exports = router;
