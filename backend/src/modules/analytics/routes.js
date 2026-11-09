const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { optionalAuth } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

// Public beacon — guests have no account. Its own ceiling keeps a scripted
// loop from inflating the console's numbers (dedupe handles the rest).
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many tracking calls.', code: 'RATE_LIMITED' },
});

router.post(
  '/track',
  trackLimiter,
  optionalAuth,
  validate({ body: schema.trackBody }),
  asyncHandler(ctrl.track),
);

module.exports = router;
