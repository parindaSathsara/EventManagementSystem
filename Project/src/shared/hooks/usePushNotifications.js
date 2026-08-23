import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { push, subscribe, CHANNELS } from '../../services';

/**
 * Push notification state for the Alerts screen toggle.
 *
 * Returns the live service status plus the three actions the UI needs, and a
 * `summary` that turns the (permission × token × switch) matrix into one line
 * a guest can act on — the difference between "you turned these off" and "the
 * OS turned these off" decides whether the button prompts or opens Settings.
 */
export default function usePushNotifications() {
  const [status, setStatus] = useState(() => push.getStatus());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(push.getStatus());
    const unsub = subscribe(CHANNELS.PUSH, () => setStatus(push.getStatus()));
    // Coming back from the system Settings screen is the one moment
    // permission can change without us asking, so re-read it there.
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') push.register({ prompt: false }).catch(() => {});
    });
    return () => {
      unsub();
      appSub.remove();
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const next = await push.enable();
      // Already answered "no" at the OS level — the app can't re-prompt, so
      // the only way forward is the system settings page.
      if (next.permission === 'denied') {
        Linking.openSettings().catch(() => {});
      }
      return next;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      return await push.disable();
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      return await push.sendTest();
    } finally {
      setBusy(false);
    }
  }, []);

  const on = status.enabled && status.permission === 'granted';

  let summary;
  if (!status.supported) {
    summary = 'Notifications need the installed app — this build can’t send them.';
  } else if (status.permission === 'denied') {
    summary = `Blocked in ${Platform.OS === 'ios' ? 'iOS' : 'Android'} settings. Tap to open them.`;
  } else if (!status.enabled) {
    summary = 'Off. You’ll still see alerts here, just not on your lock screen.';
  } else if (status.permission !== 'granted') {
    summary = 'Get a heads-up before events you follow.';
  } else if (status.remote) {
    summary = 'On. Reminders and new-event alerts are live.';
  } else {
    // Permission granted, on-device reminders armed, but no push token — the
    // server can't reach this install. Say so plainly rather than claiming
    // everything is fine.
    summary =
      status.localScheduled > 0
        ? `On. ${status.localScheduled} reminder${status.localScheduled === 1 ? '' : 's'} scheduled on this device.`
        : 'On. Follow a company to start getting reminders.';
  }

  return { ...status, on, busy, summary, enable, disable, sendTest };
}
