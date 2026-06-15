import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

const CARD_W = 220;
const CARD_H = 290;

/**
 * Horizontal flyer/banner slider for a company. Each flyer is the booking CTA
 * for its event — tapping fires `onPressFlyer(eventId)`. One card per event;
 * the card image is the event's bannerImageUrl (falling back to coverColor).
 */
export default function FlyerSlider({ events, onPressFlyer }) {
  if (!events || events.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      decelerationRate="fast"
      snapToInterval={CARD_W + SPACING.md}
    >
      {events.map((ev) => {
        const img = ev.bannerImageUrl || (ev.flyers && ev.flyers[0]) || ev.coverImageUrl;
        return (
          <TouchableOpacity
            key={ev.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => onPressFlyer && onPressFlyer(ev.id)}
          >
            {img ? (
              <ImageBackground source={{ uri: img }} style={styles.bg} imageStyle={styles.bgImage}>
                <Overlay ev={ev} />
              </ImageBackground>
            ) : (
              <LinearGradient colors={[ev.coverColor || '#1a0a2e', '#000']} style={styles.bg}>
                <Overlay ev={ev} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Overlay({ ev }) {
  const d = new Date(ev.startsAt);
  const date = d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
  return (
    <>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cta}>
        <Ionicons name="ticket" size={13} color="#000" />
        <Text style={styles.ctaText}>Book</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.flyerTitle} numberOfLines={2}>{ev.title}</Text>
        <Text style={styles.flyerDate}>{date} · {ev.venueName}</Text>
      </View>
    </>
  );
}

Overlay.propTypes = { ev: PropTypes.object.isRequired };

FlyerSlider.propTypes = {
  events: PropTypes.array,
  onPressFlyer: PropTypes.func,
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  bg: { flex: 1, justifyContent: 'flex-end' },
  bgImage: { borderRadius: RADII.lg },
  cta: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.highlight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  ctaText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
  },
  meta: {
    padding: SPACING.md,
    gap: 2,
  },
  flyerTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingBold,
    color: '#fff',
  },
  flyerDate: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
  },
});
