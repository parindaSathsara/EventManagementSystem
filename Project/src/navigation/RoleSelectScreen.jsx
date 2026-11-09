import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../theme';
import { FONT_FAMILY } from '../theme';
import { BackgroundOverlay, BrushedGlow } from '../shared/components';

const { width } = Dimensions.get('window');
const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

/**
 * Shown after a manager logs in: pick the guest side (Discover) or the
 * organizer side (Create).
 *
 * Copy reflects what the app actually does today (client feedback
 * 2026-11-09): reels are hidden, guests follow EVENTS (not artists), and
 * tickets are sold on the organizer's own ticket link.
 */
const EXPERIENCES = {
  discover: {
    title: 'Discover',
    audience: 'For fans & party-goers',
    icon: 'compass',
    cta: 'Start exploring',
    features: [
      { icon: 'calendar-outline', text: 'Browse the event calendar & timeline' },
      { icon: 'heart-outline', text: 'Follow events & get alerts before they start' },
      { icon: 'ticket-outline', text: 'Get tickets straight from the organizer' },
    ],
  },
  create: {
    title: 'Create',
    audience: 'For organizers & artists',
    icon: 'add',
    cta: 'Open organizer app',
    features: [
      { icon: 'create-outline', text: 'Create & publish your events' },
      { icon: 'people-outline', text: 'Update lineups & ticket prices anytime' },
      { icon: 'stats-chart-outline', text: 'Track your followers & next event' },
    ],
  },
};

export default function RoleSelectScreen({ onPickCustomer, onPickArtist }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const enter = { opacity: fade, transform: [{ translateY: slide }] };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />
      <BackgroundOverlay opacity={0.25} />
      <BrushedGlow color={COLORS.accent} size={width * 1.1} opacity={0.16} style={{ top: -120, left: -120 }} />
      <BrushedGlow color={COLORS.accentDeep} size={width * 0.9} opacity={0.12} style={{ bottom: -80, right: -100 }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.header, enter]}>
          <View style={styles.brand}>
            <Image
              source={require('../../assets/Logo/app-icon.png')}
              style={styles.brandIcon}
              resizeMode="cover"
            />
            <Text style={styles.brandName}>STAGE</Text>
          </View>

          <Text style={styles.kicker}>CHOOSE YOUR EXPERIENCE</Text>
          <Text style={styles.title}>How will you use Stage?</Text>
          <Text style={styles.subtitle}>
            Pick one to get started. You can switch anytime.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cards, enter]}>
          <ExperienceCard {...EXPERIENCES.discover} primary onPress={onPickCustomer} />
          <ExperienceCard {...EXPERIENCES.create} onPress={onPickArtist} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ExperienceCard({ title, audience, icon, cta, features, primary, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${audience}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <LinearGradient
        colors={['rgba(255,59,59,0.14)', 'rgba(255,59,59,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <View style={styles.cardHeadText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardAudience}>{audience}</Text>
        </View>
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={15} color={COLORS.accentSoft} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.cta, primary ? styles.ctaPrimary : styles.ctaSecondary]}>
        <Text style={[styles.ctaText, !primary && styles.ctaTextSecondary]}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color={primary ? '#fff' : COLORS.accent} />
      </View>
    </Pressable>
  );
}

ExperienceCard.propTypes = {
  title: PropTypes.string.isRequired,
  audience: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  cta: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(
    PropTypes.shape({ icon: PropTypes.string, text: PropTypes.string }),
  ).isRequired,
  primary: PropTypes.bool,
  onPress: PropTypes.func,
};

RoleSelectScreen.propTypes = {
  onPickCustomer: PropTypes.func,
  onPickArtist: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  // flexGrow + center: content sits mid-screen on tall phones and scrolls on
  // short ones — nothing gets clipped (the old flex:1 cards cut off the CTA).
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: TOP_INSET + SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  header: { marginBottom: SPACING.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.xl },
  brandIcon: { width: 36, height: 36, borderRadius: 10 },
  brandName: {
    fontSize: 18,
    letterSpacing: 3,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.6,
    maxWidth: 300,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.65)',
    marginTop: SPACING.sm,
  },

  cards: { gap: SPACING.base },
  card: {
    padding: SPACING.lg,
    borderRadius: RADII.xl,
    backgroundColor: 'rgba(18,18,18,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,59,0.22)',
    overflow: 'hidden',
  },
  cardPressed: { transform: [{ scale: 0.985 }], borderColor: COLORS.accent },

  cardHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadText: { flex: 1 },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
  },
  cardAudience: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  features: {
    marginTop: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: SPACING.md,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,59,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },

  cta: {
    marginTop: SPACING.lg,
    height: 48,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  ctaPrimary: { backgroundColor: COLORS.accent },
  ctaSecondary: { borderWidth: 1.5, borderColor: COLORS.accent },
  ctaText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#fff',
    letterSpacing: 0.2,
  },
  ctaTextSecondary: { color: COLORS.accent },
});
