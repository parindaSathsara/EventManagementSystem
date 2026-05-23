const { Router } = require('express');
const asyncHandler = require('../../lib/async-handler');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const ctrl = require('./controller');
const schema = require('./schema');

const router = Router();

// All ticket endpoints require auth — tickets are user-owned.
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
