const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { optionalAuth, requireAuth, requireRole } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

// The test button is guest-callable (guests have no account), so it gets a
// tight limit of its own on top of the app-wide one.
const testLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many test notifications. Try again later.', code: 'RATE_LIMITED' },
});

// Guest-readable reminder feed (events 1–5 days out).
router.get('/', optionalAuth, validate({ query: schema.feedQuery }), asyncHandler(ctrl.list));

// --- Push device registry -----------------------------------------------
// All guest-callable: the app registers before anyone logs in. optionalAuth
// links the row to a manager's user id when there happens to be a session.
router.post(
  '/devices',
  optionalAuth,
  validate({ body: schema.registerDeviceBody }),
  asyncHandler(ctrl.registerDevice),
);
router.get(
  '/devices/:deviceId',
  validate({ params: schema.deviceParams }),
  asyncHandler(ctrl.getDevice),
);
router.patch(
  '/devices/:deviceId',
  validate({ params: schema.deviceParams, body: schema.setEnabledBody }),
  asyncHandler(ctrl.setEnabled),
);

// --- Diagnostics ---------------------------------------------------------
router.post('/test', testLimiter, validate({ body: schema.testBody }), asyncHandler(ctrl.test));
router.post('/dispatch', requireAuth, requireRole('admin'), asyncHandler(ctrl.dispatch));

module.exports = router;
