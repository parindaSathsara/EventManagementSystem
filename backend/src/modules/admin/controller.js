const service = require('./service');
const reports = require('./reports');
const activity = require('../../lib/activity');

const ROLE_LABEL = { customer: 'guest account', artist: 'organizer', admin: 'super admin' };

async function overview(req, res) {
  res.json(await reports.overview(req.query));
}

// --- users -------------------------------------------------------------------

async function listUsers(req, res) {
  res.json(await service.listUsers(req.query));
}

async function getUser(req, res) {
  res.json(await service.getUser(req.params.id));
}

async function createUser(req, res) {
  const user = await service.createUser(req.body, req.user.id);
  activity.record(req, {
    action: 'admin.user_create',
    targetType: 'user',
    targetId: user.id,
    summary: `Created ${ROLE_LABEL[user.role]} ${user.name} (${user.email})`,
    meta: { role: user.role, handle: user.artist?.handle },
  });
  res.status(201).json(user);
}

async function updateUser(req, res) {
  const { user, changed, before } = await service.updateUser(req.params.id, req.body, req.user.id);
  if (changed.length) {
    const action = changed.includes('suspended')
      ? 'admin.user_suspend'
      : changed.includes('reactivated')
        ? 'admin.user_reactivate'
        : changed.includes('role')
          ? 'admin.user_role'
          : 'admin.user_update';
    const summary = {
      'admin.user_suspend': `Suspended ${user.name}`,
      'admin.user_reactivate': `Reactivated ${user.name}`,
      'admin.user_role': `Changed ${user.name} from ${ROLE_LABEL[before.role]} to ${ROLE_LABEL[user.role]}`,
      'admin.user_update': `Updated ${user.name}'s account`,
    }[action];
    activity.record(req, {
      action,
      targetType: 'user',
      targetId: user.id,
      summary,
      meta: { changed },
    });
  }
  res.json(user);
}

async function resetPassword(req, res) {
  const target = await service.resetPassword(req.params.id, req.body.password);
  activity.record(req, {
    action: 'admin.password_reset',
    targetType: 'user',
    targetId: target.id,
    summary: `Reset the password for ${target.name}`,
  });
  res.status(204).end();
}

async function deleteUser(req, res) {
  const target = await service.deleteUser(req.params.id, req.user.id);
  activity.record(req, {
    action: 'admin.user_delete',
    targetType: 'user',
    targetId: target.id,
    summary: `Deleted ${ROLE_LABEL[target.role]} ${target.name} (${target.email})`,
    meta: { email: target.email, role: target.role, handle: target.artist?.handle },
  });
  res.status(204).end();
}

// --- events -------------------------------------------------------------------

async function listEvents(req, res) {
  res.json(await service.listEvents(req.query));
}

async function setEventStatus(req, res) {
  const before = await service.setEventStatus(req.params.id, req.body.status);
  activity.record(req, {
    action: 'admin.event_status',
    targetType: 'event',
    targetId: before.id,
    summary: `Set “${before.title}” to ${req.body.status}`,
    meta: { from: before.status, to: req.body.status },
  });
  res.json({ id: before.id, status: req.body.status });
}

async function deleteEvent(req, res) {
  const before = await service.deleteEvent(req.params.id);
  activity.record(req, {
    action: 'admin.event_delete',
    targetType: 'event',
    targetId: before.id,
    summary: `Deleted event “${before.title}”`,
  });
  res.status(204).end();
}

// --- activity -----------------------------------------------------------------

async function listActivity(req, res) {
  res.json(await service.listActivity(req.query));
}

module.exports = {
  overview,
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  listEvents,
  setEventStatus,
  deleteEvent,
  listActivity,
};
