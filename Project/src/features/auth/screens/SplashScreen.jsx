import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../../../theme';
import { BackgroundOverlay, AnimatedGradient, BrushedGlow } from '../../../shared/components';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  // Glow breathing — same as WelcomeScreen
  const glow1 = useRef(new Animated.Value(0.12)).current;
  const glow2 = useRef(new Animated.Value(0.08)).current;
  const glow3 = useRef(new Animated.Value(0.1)).current;

  // Slow drift
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow 1 — large accent, slow deep breath
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, { toValue: 0.32, duration: 3200, useNativeDriver: true }),
        Animated.timing(glow1, { toValue: 0.12, duration: 3200, useNativeDriver: true }),
      ])
    ).start();

    // Glow 2 — highlight, offset rhythm
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, { toValue: 0.25, duration: 2800, useNativeDriver: true }),
        Animated.timing(glow2, { toValue: 0.06, duration: 3400, useNativeDriver: true }),
      ])
    ).start();

    // Glow 3 — soft white, very gentle
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow3, { toValue: 0.18, duration: 4000, useNativeDriver: true }),
        Animated.timing(glow3, { toValue: 0.06, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Drift 1 — slow diagonal float
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift1, { toValue: 1, duration: 7000, useNativeDriver: true }),
        Animated.timing(drift1, { toValue: 0, duration: 7000, useNativeDriver: true }),
      ])
    ).start();

    // Drift 2 — opposite direction
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift2, { toValue: 1, duration: 5500, useNativeDriver: true }),
        Animated.timing(drift2, { toValue: 0, duration: 5500, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const driftX1 = drift1.interpolate({ inputRange: [0, 1], outputRange: [-12, 18] });
  const driftY1 = drift1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const driftX2 = drift2.interpolate({ inputRange: [0, 1], outputRange: [8, -14] });
  const driftY2 = drift2.interpolate({ inputRange: [0, 1], outputRange: [-8, 12] });

  return (
    <View style={styles.container}>
      <BackgroundOverlay opacity={0.3} />
      <AnimatedGradient intensity={0.6} />

      {/* Large accent blue glow — upper area */}
      <Animated.View
        style={{ opacity: glow1, transform: [{ translateX: driftX1 }, { translateY: driftY1 }] }}
        pointerEvents="none"
      >
        <BrushedGlow color={COLORS.accent} size={width * 1.2} opacity={0.5} style={{ top: height * 0.06, left: -width * 0.1 }} />
      </Animated.View>

      {/* Highlight blue glow — right side */}
      <Animated.View
        style={{ opacity: glow2, transform: [{ translateX: driftX2 }, { translateY: driftY2 }] }}
        pointerEvents="none"
      >
        <BrushedGlow color={COLORS.highlight} size={380} opacity={0.4} style={{ top: height * 0.28, right: -90 }} />
      </Animated.View>

      {/* Soft white ambient glow — lower area */}
      <Animated.View
        style={{ opacity: glow3, transform: [{ translateX: Animated.multiply(driftX1, -1) }] }}
        pointerEvents="none"
      >
        <BrushedGlow color={COLORS.lightWhiteGlow} size={350} opacity={0.2} style={{ bottom: height * 0.12, left: -60 }} />
      </Animated.View>

      {/* Logo — centered */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../../../assets/Logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 100,
  },
});
