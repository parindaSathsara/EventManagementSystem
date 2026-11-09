/**
 * Super-admin console API. Every route requires a signed-in `admin`.
 */

const { Router } = require('express');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', validate({ query: schema.overviewQuery }), asyncHandler(ctrl.overview));

router.get('/users', validate({ query: schema.listUsersQuery }), asyncHandler(ctrl.listUsers));
router.post('/users', validate({ body: schema.createUserBody }), asyncHandler(ctrl.createUser));
router.get('/users/:id', validate({ params: schema.idParams }), asyncHandler(ctrl.getUser));
router.patch(
  '/users/:id',
  validate({ params: schema.idParams, body: schema.updateUserBody }),
  asyncHandler(ctrl.updateUser),
);
router.post(
  '/users/:id/password',
  validate({ params: schema.idParams, body: schema.resetPasswordBody }),
  asyncHandler(ctrl.resetPassword),
);
router.delete('/users/:id', validate({ params: schema.idParams }), asyncHandler(ctrl.deleteUser));

router.get('/events', validate({ query: schema.listEventsQuery }), asyncHandler(ctrl.listEvents));
router.patch(
  '/events/:id/status',
  validate({ params: schema.idParams, body: schema.eventStatusBody }),
  asyncHandler(ctrl.setEventStatus),
);
router.delete('/events/:id', validate({ params: schema.idParams }), asyncHandler(ctrl.deleteEvent));

router.get('/activity', validate({ query: schema.listActivityQuery }), asyncHandler(ctrl.listActivity));

module.exports = router;
