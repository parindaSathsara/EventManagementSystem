/**
 * Notifications API surface.
 *
 *  - `list()`         the in-app reminder feed (events 1–5 days out). Guest
 *                     readable; passing the device id ranks the companies this
 *                     install follows to the top.
 *  - `registerDevice` push address + liveness heartbeat for this install.
 *  - `setDeviceEnabled` the guest-facing on/off switch.
 *  - `sendTest`       "is push actually reaching me?" diagnostic.
 *
 * None of these need a token — the guest-first app has no account.
 */

import { api } from './client';

export function list(deviceId) {
  const qs = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
  return api.get(`/notifications${qs}`);
}

export function registerDevice({ deviceId, expoPushToken, platform, appVersion, enabled }) {
  return api.post('/notifications/devices', {
    deviceId,
    expoPushToken: expoPushToken || null,
    platform,
    appVersion,
    enabled,
  });
}

export function getDevice(deviceId) {
  return api.get(`/notifications/devices/${encodeURIComponent(deviceId)}`);
}

export function setDeviceEnabled(deviceId, enabled) {
  return api.patch(`/notifications/devices/${encodeURIComponent(deviceId)}`, { enabled });
}

export function sendTest(deviceId) {
  return api.post('/notifications/test', { deviceId });
}
