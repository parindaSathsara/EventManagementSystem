const { z } = require('zod');

// Matches the app's `dev-<base36>-<random>` ids (services/deviceId.js) with
// room to spare for anything a future install id scheme produces.
const deviceId = z.string().trim().min(8).max(64);

const feedQuery = z.object({
  deviceId: deviceId.optional(),
  windowDays: z.coerce.number().int().min(1).max(30).optional(),
});

const registerDeviceBody = z.object({
  deviceId,
  // Expo's address for this install. Absent when the OS hasn't granted
  // permission yet — the row is still created so the heartbeat (`lastSeenAt`)
  // and the enabled flag survive until it does.
  expoPushToken: z.string().trim().max(255).optional().nullable(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  appVersion: z.string().trim().max(40).optional(),
  enabled: z.boolean().optional(),
});

const deviceParams = z.object({ deviceId });

const setEnabledBody = z.object({ enabled: z.boolean() });

const testBody = z.object({ deviceId });

module.exports = { feedQuery, registerDeviceBody, deviceParams, setEnabledBody, testBody };
