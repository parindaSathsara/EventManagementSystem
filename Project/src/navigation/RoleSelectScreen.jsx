import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../theme';
import { BackgroundOverlay, BrushedGlow } from '../shared/components';

const { width, height } = Dimensions.get('window');

export default function RoleSelectScreen({ onPickCustomer, onPickArtist }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />
      <BackgroundOverlay opacity={0.3} />
      <BrushedGlow color={COLORS.accent} size={width * 1.1} opacity={0.18} style={{ top: -100, left: -100 }} />
      <BrushedGlow color={COLORS.highlight} size={width * 0.8} opacity={0.12} style={{ bottom: -60, right: -80 }} />

      <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Image
          source={require('../../assets/Logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.kicker}>CHOOSE YOUR EXPERIENCE</Text>
        <Text style={styles.title}>How will you{'\n'}use EventSocial?</Text>
        <Text style={styles.subtitle}>
          You can switch anytime. Both apps share the same account.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.cards, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <TouchableOpacity activeOpacity={0.92} style={styles.card} onPress={onPickCustomer}>
          <LinearGradient
            colors={['rgba(255,84,130,0.15)', 'rgba(255,84,130,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.cardIcon, { backgroundColor: COLORS.accent }]}>
            <Ionicons name="play" size={20} color="#000" />
          </View>
          <Text style={styles.cardTitle}>Discover</Text>
          <Text style={styles.cardSub}>
            Browse the calendar, watch reels, follow artists, book tickets.
          </Text>
          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>Open Customer App</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
          </View>
          <View style={styles.tagRow}>
            <Tag>Calendar</Tag>
            <Tag>Reels</Tag>
            <Tag>Tickets</Tag>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.92} style={styles.card} onPress={onPickArtist}>
          <LinearGradient
            colors={['rgba(0,255,161,0.15)', 'rgba(0,255,161,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.cardIcon, { backgroundColor: COLORS.highlight }]}>
            <Ionicons name="mic" size={20} color="#000" />
          </View>
          <Text style={styles.cardTitle}>Create</Text>
          <Text style={styles.cardSub}>
            Edit & publish reels, schedule events, track insights and bookings.
          </Text>
          <View style={styles.cardCta}>
            <Text style={[styles.cardCtaText, { color: COLORS.highlight }]}>Open Artist App</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.highlight} />
          </View>
          <View style={styles.tagRow}>
            <Tag>Reel Editor</Tag>
            <Tag>Events</Tag>
            <Tag>Insights</Tag>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function Tag({ children }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{children}</Text>
    </View>
  );
}

Tag.propTypes = { children: PropTypes.node };
RoleSelectScreen.propTypes = {
  onPickCustomer: PropTypes.func,
  onPickArtist: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong, padding: SPACING.base, paddingTop: 64, paddingBottom: 32 },
  header: { paddingHorizontal: SPACING.sm, marginBottom: SPACING.xl },
  logo: { width: 130, height: 56, marginBottom: SPACING.lg },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPE_SCALE.h1,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    maxWidth: 320,
  },
  cards: { flex: 1, gap: SPACING.md },
  card: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...TYPE_SCALE.h2,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  cardSub: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 22,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  cardCtaText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 0.4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
