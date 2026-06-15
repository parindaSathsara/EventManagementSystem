import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Avatar from '../../../shared/components/Avatar';
import LineupRow from './LineupRow';

function fmt(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
  };
}

/**
 * One full-screen event "page" in the vertical stepper feed. The event name is
 * the focus; the event owner (manager) is shown and tappable. Each event carries
 * its own poster, lineup and CTA.
 */
export default function EventStepCard({
  event,
  height,
  isFollowing,
  onToggleFollow,
  onOpenEvent,
  onOpenBooking,
  onOpenArtist,
  onOpenManager,
}) {
  const org = event.organizer || {};
  const ownerName = org.user?.name || org.handle || 'Event Company';
  const poster = event.bannerImageUrl || (event.flyers && event.flyers[0]) || event.coverImageUrl || null;
  const { date, time } = fmt(event.startsAt);

  return (
    <View style={[styles.page, { height }]}>
      {/* Owner (event manager) — top of the event */}
      <View style={styles.ownerRow}>
        <TouchableOpacity style={styles.ownerMain} activeOpacity={0.8} onPress={() => onOpenManager && onOpenManager(org)}>
          <Avatar uri={org.user?.avatarUrl} name={ownerName} size={34} verified={org.isVerified} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerLabel}>EVENT BY</Text>
            <Text style={styles.ownerName} numberOfLines={1}>{ownerName}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          activeOpacity={0.85}
          onPress={onToggleFollow}
        >
          <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description — directly under EVENT BY */}
      {event.description ? (
        <Text style={styles.desc} numberOfLines={2}>{event.description}</Text>
      ) : null}

      {/* Poster — fills the remaining space so the page is full (tap to open) */}
      <TouchableOpacity
        style={styles.poster}
        activeOpacity={0.95}
        onPress={() => onOpenEvent && onOpenEvent(event.id)}
      >
        {poster ? (
          <ImageBackground source={{ uri: poster }} style={styles.posterBg} imageStyle={styles.posterImg} resizeMode="cover">
            <PosterOverlay event={event} date={date} time={time} />
          </ImageBackground>
        ) : (
          <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={styles.posterBg}>
            <PosterOverlay event={event} date={date} time={time} />
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* This event's line up */}
      {event.lineup && event.lineup.length ? (
        <View style={styles.lineupWrap}>
          <Text style={styles.sectionLabel}>Line Up</Text>
          <LineupRow lineup={event.lineup} onArtistPress={onOpenArtist} />
        </View>
      ) : null}

      {/* Book */}
      <TouchableOpacity style={styles.bookBtn} activeOpacity={0.9} onPress={() => onOpenBooking && onOpenBooking(event.id)}>
        <Ionicons name="ticket" size={16} color="#000" />
        <Text style={styles.bookText}>Book tickets</Text>
      </TouchableOpacity>
    </View>
  );
}

function PosterOverlay({ event, date, time }) {
  return (
    <>
      <LinearGradient colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.9)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.posterTop}>
        {event.status === 'live' ? (
          <View style={styles.liveTag}>
            <Ionicons name="radio" size={12} color="#000" />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : event.category ? (
          <View style={styles.catTag}><Text style={styles.catText}>{event.category.toUpperCase()}</Text></View>
        ) : null}
      </View>
      <View style={styles.posterMeta}>
        <Text style={styles.eventName} numberOfLines={2}>{event.title}</Text>
        <View style={styles.metaLine}>
          <Ionicons name="calendar-outline" size={13} color="#fff" />
          <Text style={styles.metaText}>{date} · {time}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Ionicons name="location-outline" size={13} color="#fff" />
          <Text style={styles.metaText} numberOfLines={1}>{event.venueName}</Text>
        </View>
      </View>
    </>
  );
}

PosterOverlay.propTypes = { event: PropTypes.object, date: PropTypes.string, time: PropTypes.string };

EventStepCard.propTypes = {
  event: PropTypes.object.isRequired,
  height: PropTypes.number.isRequired,
  isFollowing: PropTypes.bool,
  onToggleFollow: PropTypes.func,
  onOpenEvent: PropTypes.func,
  onOpenBooking: PropTypes.func,
  onOpenArtist: PropTypes.func,
  onOpenManager: PropTypes.func,
};

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  poster: {
    flex: 1,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
  },
  posterBg: { flex: 1, justifyContent: 'flex-end' },
  posterImg: { borderRadius: RADII.lg },
  posterTop: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.highlight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADII.pill,
  },
  liveText: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  catTag: {
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADII.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  catText: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyBold, color: '#fff' },
  posterMeta: { padding: SPACING.md, gap: 4 },
  eventName: {
    ...TYPE_SCALE.h2,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: '#fff',
    letterSpacing: -0.4,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: 'rgba(255,255,255,0.92)',
    flexShrink: 1,
  },
  metaDot: { color: 'rgba(255,255,255,0.6)', marginHorizontal: 2 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ownerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ownerLabel: {
    fontSize: 9, letterSpacing: 1.2, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.textMuted, textTransform: 'uppercase',
  },
  ownerName: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  desc: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  followBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADII.pill, borderWidth: 1, borderColor: COLORS.accent,
  },
  followBtnActive: { backgroundColor: COLORS.accent },
  followText: { fontSize: 12, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  followTextActive: { color: '#000' },
  lineupWrap: { gap: SPACING.xs, marginHorizontal: -SPACING.base },
  sectionLabel: {
    ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.textMuted,
    letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: SPACING.base,
  },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADII.pill,
  },
  bookText: { fontSize: 15, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
});
