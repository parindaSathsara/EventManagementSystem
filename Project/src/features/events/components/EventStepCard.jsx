import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
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
 * One full-screen event "page" in the vertical stepper feed, framed by a thin
 * grey border so each event reads as its own card. The event company is the
 * headline (no "EVENT BY" prefix). "Buy Tickets" jumps straight to the
 * organizer's third-party ticketing link when one is set.
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
  const descNeedsToggle = (event.description || '').length > 90;
  // Once the event date/time has passed, buying is disabled.
  const ended = new Date(event.endsAt || event.startsAt).getTime() < Date.now();

  function handleBuy() {
    if (ended) return;
    // Third-party ticketing first; in-app reserve is only the fallback.
    if (event.ticketUrl) {
      Linking.openURL(event.ticketUrl).catch(() => {});
      return;
    }
    if (onOpenBooking) onOpenBooking(event.id);
  }

  return (
    <View style={[styles.page, { height }]}>
      <View style={styles.card}>
        {/* Company — the headline of the card (no "EVENT BY" label) */}
        <View style={styles.ownerRow}>
          <TouchableOpacity style={styles.ownerMain} activeOpacity={0.8} onPress={() => onOpenManager && onOpenManager(org)}>
            <Avatar uri={org.user?.avatarUrl} name={ownerName} size={38} verified={org.isVerified} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName} numberOfLines={1}>{ownerName}</Text>
              {org.category ? (
                <Text style={styles.ownerCat} numberOfLines={1}>{org.category}</Text>
              ) : null}
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

        {/* Poster — fills the remaining space so the page is full (tap to open).
            Portrait flyers are cropped from the BOTTOM, never the top, so the
            top of the flyer always shows exactly as uploaded. */}
        <TouchableOpacity
          style={styles.poster}
          activeOpacity={0.95}
          onPress={() => onOpenEvent && onOpenEvent(event.id)}
        >
          {poster ? (
            <TopAlignedPoster uri={poster}>
              <PosterOverlay event={event} date={date} time={time} />
            </TopAlignedPoster>
          ) : (
            <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={styles.posterBg}>
              <PosterOverlay event={event} date={date} time={time} />
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Description — "See more" jumps straight into the event page where
            the full text lives (expanding in place kept clipping long text). */}
        {event.description ? (
          <View>
            <Text style={styles.desc} numberOfLines={2}>
              {event.description}
            </Text>
            {descNeedsToggle ? (
              <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenEvent && onOpenEvent(event.id)}>
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* This event's line up */}
        {event.lineup && event.lineup.length ? (
          <View style={styles.lineupWrap}>
            <Text style={styles.sectionLabel}>Line Up</Text>
            <LineupRow
              lineup={event.lineup}
              onArtistPress={(a) => onOpenArtist && onOpenArtist(a, event)}
            />
          </View>
        ) : null}

        {/* Buy Tickets — compact pill on the right, opens third-party
            ticketing. Disabled (greyed) once the event has passed. */}
        <TouchableOpacity
          style={[styles.bookBtn, ended && styles.bookBtnEnded]}
          activeOpacity={ended ? 1 : 0.9}
          disabled={ended}
          onPress={handleBuy}
        >
          <Ionicons name="ticket" size={14} color={ended ? COLORS.textMuted : '#000'} />
          <Text style={[styles.bookText, ended && styles.bookTextEnded]}>
            {ended ? 'Event ended' : 'Buy Tickets'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Fills its parent and top-aligns the image: full width, natural aspect
 * ratio, overflow cropped at the bottom. Landscape images (shorter than the
 * box) fall back to a centered cover crop.
 */
function TopAlignedPoster({ uri, children }) {
  const [box, setBox] = useState(null);
  const [ratio, setRatio] = useState(null); // natural height / width

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w > 0) setRatio(h / w); },
      () => { if (alive) setRatio(null); },
    );
    return () => { alive = false; };
  }, [uri]);

  const topAligned = box && ratio && box.w * ratio >= box.h;

  return (
    <View
      style={styles.posterBg}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {topAligned ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, width: box.w, height: box.w * ratio }}
        />
      ) : (
        <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFill} />
      )}
      {children}
    </View>
  );
}

TopAlignedPoster.propTypes = { uri: PropTypes.string.isRequired, children: PropTypes.node };

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
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    overflow: 'hidden',
  },
  // Thin grey line box around the whole event page.
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  poster: {
    flex: 1,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
  },
  posterBg: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
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
  // Company name is the headline — bigger, no "EVENT BY" prefix.
  ownerName: { ...TYPE_SCALE.h4, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  ownerCat: {
    fontSize: 10, letterSpacing: 0.8, fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 1,
  },
  desc: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  seeMore: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginTop: 2,
  },
  // Compact follow pill.
  followBtn: {
    paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderRadius: RADII.pill, borderWidth: 1, borderColor: COLORS.accent,
  },
  followBtnActive: { backgroundColor: COLORS.accent },
  followText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  followTextActive: { color: '#000' },
  lineupWrap: { gap: SPACING.xs, marginHorizontal: -SPACING.md },
  sectionLabel: {
    ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary,
    letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: SPACING.md,
  },
  // Compact Buy Tickets pill — sits on the right of the card.
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'flex-end', backgroundColor: COLORS.accent,
    paddingVertical: 10, paddingHorizontal: SPACING.xl, borderRadius: RADII.pill,
  },
  bookBtnEnded: { backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.lineSubtle },
  bookText: { fontSize: 13, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  bookTextEnded: { color: COLORS.textMuted },
});
