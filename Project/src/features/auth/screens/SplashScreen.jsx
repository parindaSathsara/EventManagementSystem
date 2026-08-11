import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';
import { BrushedGlow } from '../../../shared/components';

const { width, height } = Dimensions.get('window');

// Reds sampled from the logo artwork itself (STAGE_Primary.png) so the splash
// glow is the same family as the mark, not an approximation.
const CORE_RED = '#F70000';
const MID_RED = '#9D0000';
const DEEP_RED = '#3A0000';

const HOLD_MS = 2400;

/**
 * Brand splash — the logomark rising out of a red glow on black.
 *
 * Layers, back to front:
 *   1. vertical black → deep-red wash (static)
 *   2. two breathing radial glows, counter-drifting, behind the mark
 *   3. an expanding halo ring that pulses out from the mark
 *   4. the white logomark, fading up with a slight scale + lift
 *   5. wordmark + loading bar
 *
 * All animation is `useNativeDriver: true` — the JS thread is busy booting
 * (session restore + repo hydration) while this is on screen, so anything
 * driven from JS would stutter.
 */
export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoLift = useRef(new Animated.Value(18)).current;

  const wordOpacity = useRef(new Animated.Value(0)).current;

  // Glow breathing.
  const glowA = useRef(new Animated.Value(0.35)).current;
  const glowB = useRef(new Animated.Value(0.15)).current;
  // Counter-drift so the light never looks static.
  const drift = useRef(new Animated.Value(0)).current;
  // Halo ring pulse.
  const ring = useRef(new Animated.Value(0)).current;
  // Loading bar sweep.
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mark entrance.
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 34,
        useNativeDriver: true,
      }),
      Animated.timing(logoLift, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Wordmark follows the mark.
    Animated.timing(wordOpacity, {
      toValue: 1,
      duration: 700,
      delay: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const breathe = (v, lo, hi, up, down) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: hi, duration: up, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: lo, duration: down, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );

    breathe(glowA, 0.35, 0.85, 2400, 2600).start();
    breathe(glowB, 0.15, 0.55, 3100, 2900).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Halo: expand + fade, repeating.
    Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(bar, {
        toValue: 1,
        duration: 1150,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ).start();

    const timer = setTimeout(() => onFinish && onFinish(), HOLD_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [10, -14] });

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.9] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });

  const barX = bar.interpolate({ inputRange: [0, 1], outputRange: [-70, 70] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* 1 — base wash: black at the edges, deep red through the middle */}
      <LinearGradient
        colors={['#000000', DEEP_RED, '#1A0000', '#000000']}
        locations={[0, 0.42, 0.68, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 2 — breathing glows behind the mark */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowLayer,
          { opacity: glowA, transform: [{ translateX: driftX }, { translateY: driftY }] },
        ]}
      >
        <BrushedGlow
          color={CORE_RED}
          size={width * 1.45}
          opacity={0.85}
          style={{ top: height * 0.5 - width * 0.72, left: -width * 0.22 }}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowLayer,
          {
            opacity: glowB,
            transform: [
              { translateX: Animated.multiply(driftX, -1) },
              { translateY: Animated.multiply(driftY, -1) },
            ],
          },
        ]}
      >
        <BrushedGlow
          color={MID_RED}
          size={width * 1.05}
          opacity={0.7}
          style={{ top: height * 0.5 - width * 0.62, left: width * 0.1 }}
        />
      </Animated.View>

      {/* 3 — halo ring pulsing out from behind the mark */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      {/* 4 + 5 — mark, wordmark, loader */}
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoLift }],
          }}
        >
          <Image
            source={require('../../../../assets/Logo/stage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: wordOpacity, alignItems: 'center' }}>
          <Text style={styles.wordmark}>STAGE</Text>
          <Text style={styles.tagline}>EVERY SHOW. ONE PLACE.</Text>

          <View style={styles.barTrack}>
            <Animated.View style={[styles.barThumb, { transform: [{ translateX: barX }] }]}>
              <LinearGradient
                colors={['transparent', CORE_RED, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Vignette — pulls the corners down so the centre glow reads brighter */}
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.28, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

SplashScreen.propTypes = {
  onFinish: PropTypes.func,
};

const RING = width * 0.62;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: { ...StyleSheet.absoluteFillObject },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
    borderColor: CORE_RED,
    top: height * 0.5 - RING / 2 - height * 0.045,
  },
  center: { alignItems: 'center', zIndex: 2 },
  logo: {
    width: width * 0.52,
    height: width * 0.46,
  },
  wordmark: {
    fontSize: 34,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: 10,
    marginTop: SPACING.lg,
    // Red bloom under the wordmark, echoing the logo's glow.
    textShadowColor: 'rgba(247,0,0,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 3.4,
    marginTop: SPACING.sm,
  },
  barTrack: {
    width: 140,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    marginTop: SPACING.xl,
  },
  barThumb: {
    width: 70,
    height: 2,
  },
});
