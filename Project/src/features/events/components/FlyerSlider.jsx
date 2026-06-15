import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = SPACING.base;
const BANNER_W = SCREEN_W - H_PAD * 2;
// Landscape banner (~16:9).
const BANNER_H = Math.round(BANNER_W * 9 / 16);
const GAP = SPACING.sm;

/**
 * Swipeable, full-width **landscape** banner carousel for an event manager.
 * One banner per event; swipe left/right, page dots track position. Tapping a
 * banner fires `onPressFlyer(eventId)` (the booking CTA).
 */
export default function FlyerSlider({ events, onPressFlyer }) {
  const [index, setIndex] = useState(0);
  if (!events || events.length === 0) return null;

  const stride = BANNER_W + GAP;

  return (
    <View>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        decelerationRate="fast"
        contentContainerStyle={styles.scroll}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / stride))
        }
        renderItem={({ item: ev }) => {
          const img = ev.bannerImageUrl || (ev.flyers && ev.flyers[0]) || ev.coverImageUrl;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => onPressFlyer && onPressFlyer(ev.id)}
            >
              {img ? (
                <ImageBackground source={{ uri: img }} style={styles.bg} imageStyle={styles.bgImage} resizeMode="cover">
                  <Overlay ev={ev} />
                </ImageBackground>
              ) : (
                <LinearGradient colors={[ev.coverColor || '#1a0a2e', '#000']} style={styles.bg}>
                  <Overlay ev={ev} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          );
        }}
      />
      {events.length > 1 ? (
        <View style={styles.dots}>
          {events.map((e, i) => (
            <View key={e.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Overlay({ ev }) {
  const d = new Date(ev.startsAt);
  const date = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <>
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
      <View style={styles.cta}>
        <Ionicons name="ticket" size={13} color="#000" />
        <Text style={styles.ctaText}>Book</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.flyerTitle} numberOfLines={1}>{ev.title}</Text>
        <Text style={styles.flyerDate} numberOfLines={1}>{date} · {ev.venueName}</Text>
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
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  card: {
    width: BANNER_W,
    height: BANNER_H,
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
  ctaText: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  meta: {
    padding: SPACING.md,
    gap: 2,
  },
  flyerTitle: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: '#fff',
  },
  flyerDate: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lineSubtle,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 16,
  },
});
