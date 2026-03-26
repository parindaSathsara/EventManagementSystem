import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';
import { Button, BackgroundOverlay, BrushedGlow, AnimatedGradient } from '../../../shared/components';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ onJoinNow, onLogIn }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  // Glow breathing — staggered rhythms
  const glow1 = useRef(new Animated.Value(0.12)).current;
  const glow2 = useRef(new Animated.Value(0.08)).current;
  const glow3 = useRef(new Animated.Value(0.1)).current;

  // Slow drift
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Content entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1000,
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
  }, []);

  const driftX1 = drift1.interpolate({ inputRange: [0, 1], outputRange: [-12, 18] });
  const driftY1 = drift1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const driftX2 = drift2.interpolate({ inputRange: [0, 1], outputRange: [8, -14] });
  const driftY2 = drift2.interpolate({ inputRange: [0, 1], outputRange: [-8, 12] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />

      <BackgroundOverlay opacity={0.3} />
      <AnimatedGradient intensity={0.6} />

      {/* ── Glowing Layer ── */}
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

      {/* Soft white ambient glow — lower area for depth */}
      <Animated.View
        style={{ opacity: glow3, transform: [{ translateX: Animated.multiply(driftX1, -1) }] }}
        pointerEvents="none"
      >
        <BrushedGlow color={COLORS.lightWhiteGlow} size={350} opacity={0.2} style={{ bottom: height * 0.12, left: -60 }} />
      </Animated.View>

      {/* Top section — Logo & Tagline */}
      <Animated.View
        style={[
          styles.topSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Image
          source={require('../../../../assets/Logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headline}>Discover Live.{'\n'}Feel the Vibe.</Text>
        <Text style={styles.subtitle}>
          Find events, connect with artists, and experience moments that move you.
        </Text>
      </Animated.View>

      {/* Bottom section — CTAs */}
      <Animated.View
        style={[
          styles.bottomSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Button
          title="Join Now"
          onPress={onJoinNow}
          variant="primary"
          style={styles.joinButton}
        />
        <Button
          title="Log In"
          onPress={onLogIn}
          variant="secondary"
          style={styles.loginButton}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social login row */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Ionicons name="logo-google" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Ionicons name="logo-apple" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgStrong,
    overflow: 'hidden',
  },
  /* ── Top Section ── */
  topSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.max,
  },
  logo: {
    width: 160,
    height: 70,
    marginBottom: SPACING.xl,
  },
  headline: {
    fontSize: 36,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    lineHeight: 44,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    maxWidth: 300,
  },
  /* ── Bottom Section ── */
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  joinButton: {
    marginBottom: SPACING.md,
  },
  loginButton: {
    marginBottom: SPACING.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lineSubtle,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.accent,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
});
