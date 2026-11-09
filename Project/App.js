import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  SplashScreen,
  WelcomeScreen,
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  CompleteProfileScreen,
} from './src/features/auth';
import { BecomeArtistScreen } from './src/features/artistApp';
import { GuestTabs, CustomerTabs, ArtistTabs, RoleSelectScreen } from './src/navigation';
import { AlertProvider, UserProvider, useUser } from './src/shared/providers';
import { useAlert } from './src/shared/hooks';
import { hydrateAll, clearAll, push, analytics } from './src/services';
import { auth as authApi } from './src/services/api';
import AppErrorBoundary from './src/shared/components/AppErrorBoundary';
import { holdNativeSplash, hideNativeSplash } from './src/shared/utils/nativeSplash';

// Hold the OS launch screen while we boot. It is released by the effect in
// AppContent as soon as fonts + boot are done — on EVERY route, not just the
// animated splash — and by a failsafe timer if anything at all goes wrong.
holdNativeSplash();

// The boot sequence (session restore + artist lookup) may never keep the user
// waiting longer than this. Whatever hasn't answered by then is abandoned and
// the app opens as a guest; a late session still signs the user in quietly.
const BOOT_MAX_MS = 9000;

// Module scope on purpose: a notification tap can launch the app, and the
// foreground handler + Android channels must exist before React mounts or the
// first alert of the session is silently dropped. Guarded: a throw here would
// kill the bundle before React mounts — a permanent launch screen.
try {
  push.configure();
} catch (e) {
  console.warn('[boot] push.configure failed', e);
}

/**
 * Boot sequence (guest-first)
 * ---------------------------
 *   splash → guest (GuestTabs: Reels · Events · Notifications)
 *
 * The app no longer gates browsing behind login — everyone is a guest. Event
 * managers reach the publishing app via a discreet "manager login" entry in
 * the guest UI, which routes through the (preserved) auth flow:
 *
 *   guest → login|signup → completeProfile → roleSelect → artist (manager app)
 *
 * A relaunch with a saved session always opens on the guest feed (Timeline),
 * never on roleSelect; a signed-in manager re-enters their app from the feed
 * without logging in again (openManagerApp).
 *
 * The dormant customer experience (`CustomerTabs`, the role chooser's customer
 * branch) is kept for reversibility — see docs/REWORK-2026-06-guest-mode.md.
 * No mock data anywhere; everything renders from the backend.
 */

function isManager(u) {
  return u && (u.role === 'artist' || u.role === 'admin');
}

function AppContent() {
  const [stage, setStage] = useState('splash');
  const [bootReady, setBootReady] = useState(false);
  // Set when a notification is tapped. Carries a nonce as well as the id so
  // tapping the same event twice still re-opens it.
  const [pushTarget, setPushTarget] = useState(null);
  const { user, artist, setUser, logout } = useUser();
  const alert = useAlert();

  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // A font that fails to load must not hold the app hostage: carry on with
  // the system font rather than rendering nothing forever.
  const fontsReady = fontsLoaded || !!fontError;
  useEffect(() => {
    if (fontError) console.warn('[boot] fonts failed to load', fontError);
  }, [fontError]);

  // Set once boot has been given up on (BOOT_MAX_MS) — a late answer may
  // still sign the user in, but must not yank them off the screen they're on.
  const bootAbandoned = useRef(false);

  // On boot: restore the session (if a JWT is on disk), then hydrate the
  // repos from the backend. Every step is tolerant of network failure AND
  // bounded in time, so the splash never waits on a dead server.
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setBootReady(true);
    };

    const watchdog = setTimeout(() => {
      if (finished) return;
      console.warn(`[boot] gave up waiting after ${BOOT_MAX_MS}ms — opening as guest`);
      bootAbandoned.current = true;
      finish();
    }, BOOT_MAX_MS);

    (async () => {
      try {
        const restored = await authApi.restoreSession();
        // hydrateAll runs in parallel; each repo swallows its own error and
        // surfaces it via the per-hook ConnectionError component. We hydrate
        // for guests too so the Events/Calendar/Notifications tabs warm up.
        hydrateAll().catch(() => {});
        if (restored) {
          await setUser(restored);
          // Every returning user — manager or not — opens on the feed
          // (Timeline). The Discover/Create chooser is only shown right after
          // logging in, never on a relaunch (client feedback 2026-11-09).
          // Managers reach their app from the feed via openManagerApp().
          if (!bootAbandoned.current) setStage('guest');
        }
        // No session → stay on splash; SplashScreen.onFinish drops into guest.
      } catch (e) {
        console.warn('[boot] session restore failed', e);
      } finally {
        clearTimeout(watchdog);
        finish();
      }
    })();

    return () => clearTimeout(watchdog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App opens for the admin console: one on launch, one per return to the
  // foreground (the backend collapses repeats within 30 minutes).
  useEffect(() => {
    analytics.trackAppOpen();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') analytics.trackAppOpen();
    });
    return () => sub.remove();
  }, []);

  // Release the OS launch screen the moment we can draw — whichever screen
  // boot landed on (splash, guest tabs, role select, …). It used to be tied
  // to the animated splash's onLayout, so returning users, who skip that
  // screen, were left stuck behind the launch screen forever.
  useEffect(() => {
    if (fontsReady && bootReady) hideNativeSplash();
  }, [fontsReady, bootReady]);

  // Tapping an alert — from the tray or from the lock screen, warm or cold —
  // opens that event. Registered once, high up, so the target survives the
  // guest/manager stage switches below.
  useEffect(() => {
    return push.addResponseListener(({ eventId }) => {
      if (!eventId) return;
      setPushTarget({ eventId, nonce: Date.now() });
      // A tap always lands in the guest experience: that's where events open.
      setStage((current) => (current === 'splash' ? 'guest' : current));
    });
  }, []);

  // Organizer entry points on the feed (Timeline "+", Calendar CTA). A
  // manager who is already signed in goes straight to their app instead of
  // being asked to log in again; everyone else goes to login.
  function openManagerApp() {
    if (!isManager(user)) {
      setStage('login');
    } else if (!user.phone) {
      setStage('completeProfile');
    } else {
      setStage(artist ? 'artist' : 'becomeArtist');
    }
  }

  async function handleLogout() {
    await logout();
    clearAll();
    setStage('guest');
  }

  async function handleLoginSuccess(authedUser) {
    await setUser(authedUser);
    // Warm the caches as soon as the JWT is on the client.
    hydrateAll().catch(() => {});
    if (!authedUser?.phone) {
      setStage('completeProfile');
    } else if (isManager(authedUser)) {
      alert.success(
        'Login',
        `Welcome back, ${authedUser.name || authedUser.email}!`,
        () => setStage('roleSelect'),
      );
    } else {
      // A non-manager who logs in just returns to the guest experience.
      setStage('guest');
    }
  }

  async function handleSignupSuccess(authedUser) {
    await setUser(authedUser);
    hydrateAll().catch(() => {});
    setStage('completeProfile');
  }

  async function handleProfileComplete({ phone, city, avatarUrl }) {
    try {
      const updated = await authApi.updateProfile({ phone, city, avatarUrl });
      await setUser(updated);
    } catch (e) {
      alert.error('Could not save profile', e?.message || 'Please try again.');
      return;
    }
    setStage('roleSelect');
  }

  // The OS launch screen covers this blank frame until both are ready.
  if (!fontsReady || !bootReady) return null;

  if (stage === 'splash') {
    return (
      <View style={styles.root}>
        <SplashScreen onFinish={() => setStage('guest')} />
      </View>
    );
  }

  if (stage === 'welcome') {
    return (
      <WelcomeScreen
        onJoinNow={() => setStage('signup')}
        onLogIn={() => setStage('login')}
      />
    );
  }

  if (stage === 'login') {
    return (
      <LoginScreen
        onBack={() => setStage('guest')}
        onLogin={async (data) => {
          try {
            const authed = await authApi.login(data);
            await handleLoginSuccess(authed);
          } catch (e) {
            alert.error('Login failed', e?.message || 'Please check your credentials.');
          }
        }}
        onGoToSignup={() => setStage('signup')}
        onGoToForgotPassword={() => setStage('forgotPassword')}
      />
    );
  }

  if (stage === 'signup') {
    return (
      <SignupScreen
        onBack={() => setStage('guest')}
        onSignup={async (data) => {
          try {
            const authed = await authApi.signup(data);
            await handleSignupSuccess(authed);
          } catch (e) {
            alert.error('Sign up failed', e?.message || 'Please try again.');
          }
        }}
        onGoToLogin={() => setStage('login')}
      />
    );
  }

  if (stage === 'forgotPassword') {
    return (
      <ForgotPasswordScreen
        onBack={() => setStage('login')}
        onResetPassword={(data) =>
          alert.info('Reset', `Reset link sent to ${data.email}`)
        }
      />
    );
  }

  if (stage === 'completeProfile') {
    return (
      <CompleteProfileScreen
        user={user}
        onSubmit={handleProfileComplete}
        onSkip={() => setStage('roleSelect')}
      />
    );
  }

  if (stage === 'roleSelect') {
    return (
      <RoleSelectScreen
        onPickCustomer={() => setStage('guest')}
        // First-time artist? Route them through the Become an Artist flow
        // before dropping them into the artist tabs.
        onPickArtist={() => setStage(artist ? 'artist' : 'becomeArtist')}
      />
    );
  }

  if (stage === 'becomeArtist') {
    return (
      <BecomeArtistScreen
        onSuccess={() => setStage('artist')}
        onBack={() => setStage('roleSelect')}
      />
    );
  }

  if (stage === 'artist') {
    return (
      <ArtistTabs
        onSwitchToCustomer={() => setStage('guest')}
        onLogout={handleLogout}
        onNeedArtistProfile={() => setStage('becomeArtist')}
      />
    );
  }

  // Dormant customer experience — preserved for reversibility, not reachable
  // from the guest-first boot flow (see docs/REWORK-2026-06-guest-mode.md).
  if (stage === 'customer') {
    return (
      <CustomerTabs
        onSwitchToArtist={() => setStage('artist')}
        onLogout={handleLogout}
      />
    );
  }

  // Default: guest experience (Reels · Events · Notifications).
  return (
    <GuestTabs
      onManagerLogin={openManagerApp}
      openEvent={pushTarget}
      onOpenEventHandled={() => setPushTarget(null)}
    />
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AlertProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AlertProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
