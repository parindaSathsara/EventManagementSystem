/**
 * Single mount point for every feature module. New module?
 *   1. Drop it under src/modules/<name>/
 *   2. Add one line here.
 */

const { Router } = require('express');
const authRoutes = require('./modules/auth/routes');
const eventsRoutes = require('./modules/events/routes');
const reelsRoutes = require('./modules/reels/routes');
const ticketsRoutes = require('./modules/tickets/routes');
const artistsRoutes = require('./modules/artists/routes');
const uploadsRoutes = require('./modules/uploads/routes');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/reels', reelsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/artists', artistsRoutes);
router.use('/uploads', uploadsRoutes);

module.exports = router;
