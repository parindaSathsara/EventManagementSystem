/**
 * Audit trail writer — feeds the super-admin console's activity reports.
 *
 *   activity.record(req, {
 *     action: 'event.update',
 *     targetType: 'event', targetId: event.id,
 *     summary: `Updated event “${event.title}”`,
 *     meta: { fields: ['title'] },
 *   });
 *
 * Fire-and-forget by design: it never throws and never delays the response.
 * Losing one audit row is acceptable; failing a user's request because the
 * log table hiccupped is not.
 *
 * The actor defaults to `req.user`; pass `actor` explicitly when the request
 * isn't authenticated yet (login, signup) or for a failed login (`actor:
 * { email }`).
 */

const prisma = require('../prisma');
const { clientIp, userAgent, clientSource } = require('./request-meta');

function clip(value, max) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function record(req, { action, actor, targetType, targetId, summary, meta } = {}) {
  if (!action) return;
  const who = actor === undefined ? req?.user : actor;
  const data = {
    action: clip(action, 64),
    actorUserId: who?.id || null,
    actorEmail: clip(who?.email, 191),
    actorRole: clip(who?.role, 16),
    targetType: clip(targetType, 32),
    targetId: clip(targetId, 64),
    summary: clip(summary, 255),
    metaJson: meta ? JSON.stringify(meta).slice(0, 20000) : null,
    ip: req ? clientIp(req) : null,
    userAgent: req ? userAgent(req) : null,
    source: req ? clientSource(req) : 'api',
  };
  prisma.activityLog.create({ data }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[activity] could not record', action, err?.message);
  });
}

module.exports = { record };
