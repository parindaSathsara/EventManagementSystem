const service = require('./service');
const { BadRequest, NotFound } = require('../../lib/errors');

async function list(req, res) {
  // optionalAuth: req.user is present only for logged-in managers. `deviceId`
  // is what a guest has instead — it tells us which companies they follow.
  const result = await service.feed(req.user ? req.user.id : null, {
    deviceId: req.query.deviceId || null,
    ...(req.query.windowDays ? { windowDays: req.query.windowDays } : {}),
  });
  res.json(result);
}

/** Register or refresh this install's push address. Also the boot heartbeat. */
async function registerDevice(req, res) {
  const device = await service.registerDevice(req.body, req.user ? req.user.id : null);
  res.json(device);
}

async function getDevice(req, res) {
  const device = await service.getDevice(req.params.deviceId);
  if (!device) throw new NotFound('Device not registered');
  res.json(device);
}

/** The guest-facing on/off switch in the Alerts tab. */
async function setEnabled(req, res) {
  const device = await service.setDeviceEnabled(req.params.deviceId, req.body.enabled);
  res.json(device);
}

/**
 * Send a test push to one install. Public on purpose — guests have no account
 * and this is the "is it actually working?" button in the Alerts tab — but
 * only ever delivers to an already-registered device id, and the route is
 * rate limited.
 */
async function test(req, res) {
  const result = await service.sendTest(req.body.deviceId);
  if (!result.ok) {
    const readable = {
      DEVICE_NOT_REGISTERED: 'This device has not registered for push notifications yet.',
      NO_PUSH_TOKEN: 'No push token for this device — grant notification permission first.',
      DISABLED: 'Notifications are switched off for this device.',
      PUSH_DISABLED_ON_SERVER: 'Push delivery is disabled on the server.',
      DeviceNotRegistered: 'The push token has expired. Reopen the app to register a new one.',
      MismatchSenderId: 'Push credentials mismatch — check the FCM key on the Expo project.',
    };
    throw new BadRequest(readable[result.reason] || 'Could not send the test notification.', {
      code: result.reason,
      details: result.details,
    });
  }
  res.json(result);
}

/** Manual sweep — admin escape hatch for testing without waiting for the cron. */
async function dispatch(req, res) {
  const [publishes, reminders, receipts] = await Promise.all([
    service.dispatchPendingPublishes(),
    service.dispatchReminders({ includeActiveDevices: req.query.all === 'true' }),
    service.checkReceipts(),
  ]);
  res.json({ publishes, reminders, receipts });
}

module.exports = { list, registerDevice, getDevice, setEnabled, test, dispatch };
