const service = require('./service');
const activity = require('../../lib/activity');

async function signup(req, res) {
  const result = await service.signup(req.body);
  activity.record(req, {
    action: 'auth.signup',
    actor: result.user,
    targetType: 'user',
    targetId: result.user.id,
    summary: `New account created by ${result.user.name}`,
  });
  res.status(201).json(result);
}

async function login(req, res) {
  let result;
  try {
    result = await service.login(req.body);
  } catch (err) {
    // Failed attempts are what the console's security view is made of — the
    // email is the only identity we have, so it's kept as a snapshot.
    activity.record(req, {
      action: 'auth.login_failed',
      actor: { email: req.body?.email },
      summary: err?.code === 'ACCOUNT_DISABLED' ? 'Blocked sign-in to a disabled account' : 'Failed sign-in attempt',
    });
    throw err;
  }
  activity.record(req, {
    action: 'auth.login',
    actor: result.user,
    targetType: 'user',
    targetId: result.user.id,
    summary: `${result.user.name} signed in`,
  });
  res.json(result);
}

async function me(req, res) {
  res.json(req.user);
}

async function completeProfile(req, res) {
  const updated = await service.updateProfile(req.user.id, req.body);
  activity.record(req, {
    action: 'profile.update',
    targetType: 'user',
    targetId: req.user.id,
    summary: `${updated.name} updated their profile`,
    meta: { fields: Object.keys(req.body || {}) },
  });
  res.json(updated);
}

module.exports = { signup, login, me, completeProfile };
