import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
import * as SplashScreenModule from 'expo-splash-screen';
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
import { hydrateAll, clearAll } from './src/services';
import { auth as authApi } from './src/services/api';

SplashScreenModule.preventAutoHideAsync();

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
  const { user, artist, setUser, logout } = useUser();
  const alert = useAlert();

  const [fontsLoaded] = useFonts({
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

  // On boot: restore the session (if a JWT is on disk), then hydrate the
  // repos from the backend. Both calls are tolerant of network failure so
  // we never block the splash screen waiting on a dead server.
  useEffect(() => {
    (async () => {
      try {
        const restored = await authApi.restoreSession();
        // hydrateAll runs in parallel; each repo swallows its own error and
        // surfaces it via the per-hook ConnectionError component. We hydrate
        // for guests too so the Events/Calendar/Notifications tabs warm up.
        hydrateAll().catch(() => {});
        if (restored) {
          await setUser(restored);
          if (isManager(restored)) {
            // A returning manager resumes in the publishing app.
            setStage(restored.phone ? 'roleSelect' : 'completeProfile');
          } else {
            setStage('guest');
          }
        }
        // No session → stay on splash; SplashScreen.onFinish drops into guest.
      } catch (e) {
        console.warn('[boot] session restore failed', e);
      } finally {
        setBootReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && bootReady) {
      await SplashScreenModule.hideAsync();
    }
  }, [fontsLoaded, bootReady]);

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

  async function handleProfileComplete({ phone, city }) {
    try {
      const updated = await authApi.updateProfile({ phone, city });
      await setUser(updated);
    } catch (e) {
      alert.error('Could not save profile', e?.message || 'Please try again.');
      return;
    }
    setStage('roleSelect');
  }

  if (!fontsLoaded || !bootReady) return null;

  if (stage === 'splash') {
    return (
      <View style={styles.root} onLayout={onLayoutRootView}>
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
  return <GuestTabs onManagerLogin={() => setStage('login')} />;
}

export default function App() {
  return (
    <AlertProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
