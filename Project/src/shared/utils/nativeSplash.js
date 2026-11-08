import * as SplashScreen from 'expo-splash-screen';

/**
 * The OS-level launch screen (Stage logo on dark red) — one owner, one rule:
 * it is held while the app boots and it is ALWAYS released, whatever happens.
 *
 * History: the hide used to live in the animated splash screen's onLayout.
 * A returning (logged-in) user skips that screen, so the hide never ran and
 * the app opened behind a launch screen that never went away — the
 * "stuck on splash after clearing recent apps" bug (2026-11-08).
 *
 * Guarantees:
 *   - `hideNativeSplash()` is idempotent and never throws.
 *   - `holdNativeSplash()` also arms a failsafe: whatever goes wrong in JS
 *     (a hung request, a font that never loads, a crash in the first
 *     screen), the launch screen is released after FAILSAFE_MS.
 */
const FAILSAFE_MS = 12000;

let hidden = false;
let failsafe = null;

export function holdNativeSplash() {
  SplashScreen.preventAutoHideAsync().catch(() => {});
  if (!failsafe) {
    failsafe = setTimeout(() => {
      if (!hidden) console.warn('[splash] failsafe released the launch screen');
      hideNativeSplash();
    }, FAILSAFE_MS);
  }
}

export function hideNativeSplash() {
  if (hidden) return;
  hidden = true;
  if (failsafe) {
    clearTimeout(failsafe);
    failsafe = null;
  }
  SplashScreen.hideAsync().catch(() => {});
}
