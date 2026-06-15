import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';
import Chip from './Chip';

function formatDay(iso) {
  if (!iso) return { day: '--', month: '---' };
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function EventCard({ event, onPress, variant = 'default' }) {
  const { day, month, time } = formatDay(event.startsAt);
  const imgUrl = event.coverImageUrl || event.bannerImageUrl || (event.flyers && event.flyers[0]) || null;

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.compactWrap}>
        <View style={styles.dateBadgeSm}>
          <Text style={styles.dateBadgeMonth}>{month}</Text>
          <Text style={styles.dateBadgeDay}>{day}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compactTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.compactMeta} numberOfLines={1}>
            {time} · {event.venueName}
          </Text>
          {event.status === 'live' ? (
            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Chip label="LIVE" variant="live" icon="radio" />
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.coverWrap}>
        {/* Backend returns a `coverImageUrl` string; legacy mocks used a
            local `coverImage` asset. Accept both, fall back to the gradient. */}
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.cover} />
        ) : event.coverImage ? (
          <Image source={event.coverImage} style={styles.cover} />
        ) : (
          <LinearGradient
            colors={[event.coverColor || '#1a0a2e', '#000']}
            style={styles.cover}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeMonth}>{month}</Text>
          <Text style={styles.dateBadgeDay}>{day}</Text>
        </View>

        {event.status === 'live' ? (
          <View style={styles.liveTag}>
            <Chip label="LIVE NOW" variant="live" icon="radio" />
          </View>
        ) : null}

        <View style={styles.cardContent}>
          {event.category ? (
            <Text style={styles.category}>{event.category.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venueName} · {event.cityName}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{time}</Text>
            {event.distanceKm != null ? (
              <>
                <View style={styles.dotSep} />
                <Text style={styles.metaText}>{event.distanceKm.toFixed(1)} km</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

EventCard.propTypes = {
  event: PropTypes.object.isRequired,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact']),
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    marginBottom: SPACING.md,
  },
  coverWrap: {
    height: 200,
    position: 'relative',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dateBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 50,
  },
  dateBadgeSm: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 46,
  },
  dateBadgeMonth: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
  dateBadgeDay: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.ink,
    marginTop: -2,
  },
  liveTag: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.base,
    gap: 4,
  },
  category: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  title: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 4,
  },

  /* compact variant */
  compactWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    marginBottom: SPACING.sm,
  },
  compactTitle: {
    ...TYPE_SCALE.bodyLg,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  compactMeta: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

