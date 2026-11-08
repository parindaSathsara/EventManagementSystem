import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';
import Chip from './Chip';
import SquareFlyer from './SquareFlyer';
import { hasStartTime, timeLabel, venueLine } from '../utils';

// Square flyer thumbnail on the compact (list-row) variant.
const COMPACT_THUMB = 64;

function formatDay(iso) {
  if (!iso) return { day: '--', month: '---' };
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  };
}

export default function EventCard({ event, onPress, variant = 'default' }) {
  const { day, month } = formatDay(event.startsAt);
  // Day-only events show "Time TBA" rather than the placeholder hour.
  const time = timeLabel(event, { short: true });
  const timePending = !hasStartTime(event);
  const imgUrl = event.coverImageUrl || event.bannerImageUrl || (event.flyers && event.flyers[0]) || null;

  if (variant === 'grid') {
    // Half-width tile for 2-per-row calendar layouts. Company name on top —
    // the event company is the focus per client feedback.
    const org = event.organizer || {};
    const companyName = org.user?.name || org.handle || null;
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.gridWrap}>
        <View style={styles.gridCover}>
          {imgUrl ? (
            // Square tile showing the whole flyer, same as the event page.
            <SquareFlyer uri={imgUrl} style={styles.cover} />
          ) : (
            <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={styles.cover} />
          )}
          <View style={styles.gridDate}>
            <Text style={styles.dateBadgeMonth}>{month}</Text>
            <Text style={styles.dateBadgeDay}>{day}</Text>
          </View>
          {event.status === 'live' ? (
            <View style={styles.gridLive}>
              <Chip label="LIVE" variant="live" icon="radio" />
            </View>
          ) : null}
        </View>
        <View style={styles.gridBody}>
          {companyName ? (
            <Text style={styles.gridCompany} numberOfLines={1}>{companyName}</Text>
          ) : null}
          <Text style={styles.gridTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={[styles.gridMeta, timePending && styles.metaPending]} numberOfLines={1}>
            {time} · {venueLine(event, { withCity: false })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.compactWrap}>
        {/* Square flyer thumbnail (top of the flyer pinned to the top) with
            the date chip on it; gradient when the event has no flyer. */}
        <SquareFlyer uri={imgUrl} size={COMPACT_THUMB} style={styles.compactThumb}>
          {!imgUrl ? (
            <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.compactDate}>
            <Text style={styles.compactDateMonth}>{month}</Text>
            <Text style={styles.compactDateDay}>{day}</Text>
          </View>
        </SquareFlyer>
        <View style={{ flex: 1 }}>
          <Text style={styles.compactTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={[styles.compactMeta, timePending && styles.metaPending]} numberOfLines={1}>
            {time} · {venueLine(event, { withCity: false })}
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

  // Listing card: the flyer as a full-width SQUARE (nothing printed over the
  // artwork except the date and LIVE chips), the details underneath.
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.coverWrap}>
        {imgUrl ? (
          <SquareFlyer uri={imgUrl} style={styles.cover} />
        ) : (
          <LinearGradient
            colors={[event.coverColor || '#1a0a2e', '#000']}
            style={styles.cover}
          />
        )}

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeMonth}>{month}</Text>
          <Text style={styles.dateBadgeDay}>{day}</Text>
        </View>

        {event.status === 'live' ? (
          <View style={styles.liveTag}>
            <Chip label="LIVE NOW" variant="live" icon="radio" />
          </View>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        {event.category ? (
          <Text style={styles.category}>{event.category.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {venueLine(event)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
          <Text style={[styles.metaText, timePending && styles.metaPending]}>{time}</Text>
          {event.distanceKm != null ? (
            <>
              <View style={styles.dotSep} />
              <Text style={styles.metaText}>{event.distanceKm.toFixed(1)} km</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

EventCard.propTypes = {
  event: PropTypes.object.isRequired,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'grid']),
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    marginBottom: SPACING.md,
  },
  // Square flyer, full card width.
  coverWrap: {
    width: '100%',
    aspectRatio: 1,
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
  // Details sit BELOW the flyer so nothing covers the artwork.
  cardContent: {
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

  /* grid variant (2-per-row) */
  gridWrap: {
    flex: 1,
    borderRadius: RADII.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  gridCover: { width: '100%', aspectRatio: 1, position: 'relative' },
  gridDate: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 38,
  },
  gridLive: { position: 'absolute', top: SPACING.xs, right: SPACING.xs },
  gridBody: { padding: SPACING.sm, gap: 2 },
  gridCompany: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  gridTitle: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    minHeight: 34,
  },
  gridMeta: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  // Unannounced time reads as a teaser, not as real data.
  metaPending: { color: COLORS.accent, fontFamily: FONT_FAMILY.bodySemiBold },

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
  compactThumb: { borderRadius: RADII.sm },
  compactDate: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
  },
  compactDateMonth: {
    fontSize: 8,
    letterSpacing: 0.6,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
  compactDateDay: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.ink,
    marginTop: -2,
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

