import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import * as SplashScreenModule from 'expo-splash-screen';
import { SplashScreen, WelcomeScreen, LoginScreen, SignupScreen, ForgotPasswordScreen } from './src/features/auth';
import { ReelsScreen } from './src/features/reels';
import { AlertProvider } from './src/shared/providers';
import { useAlert } from './src/shared/hooks';

SplashScreenModule.preventAutoHideAsync();

function AppContent() {
  const [screen, setScreen] = useState('splash');
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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenModule.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (screen === 'splash') {
    return (
      <View style={styles.root} onLayout={onLayoutRootView}>
        <SplashScreen onFinish={() => setScreen('welcome')} />
      </View>
    );
  }

  if (screen === 'reels') {
    return <ReelsScreen />;
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onBack={() => setScreen('welcome')}
        onLogin={(data) => {
          alert.success('Login', `Welcome back, ${data.email}!`, () => setScreen('reels'));
        }}
        onGoToSignup={() => setScreen('signup')}
        onGoToForgotPassword={() => setScreen('forgotPassword')}
      />
    );
  }

  if (screen === 'forgotPassword') {
    return (
      <ForgotPasswordScreen
        onBack={() => setScreen('login')}
        onResetPassword={(data) => alert.info('Reset', `Reset link sent to ${data.email}`)}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignupScreen
        onBack={() => setScreen('welcome')}
        onSignup={(data) => {
          alert.success('Signed Up', `Welcome, ${data.fullName}!`, () => setScreen('reels'));
        }}
        onGoToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <WelcomeScreen
      onJoinNow={() => setScreen('signup')}
      onLogIn={() => setScreen('login')}
    />
  );
}

export default function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
