import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Avatar from '../../../shared/components/Avatar';
import ComingSoon from '../../../shared/components/ComingSoon';
import { TEASER, hasVenue, hasLineup, hasStartTime, pendingDetails, timeLabel, venueLine } from '../../../shared/utils';
import LineupRow from './LineupRow';

function fmtDay(iso) {
  return new Date(iso).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
}

// The card's base tone — the flyer fades into this.
const INK = '10,3,3';
// How far above the details block the flyer starts fading, and how far into
// it the fade completes (px). The details always sit on a solid-enough base
// to read, while everything above them is the untouched flyer.
const FADE_LEAD = 110;
const FADE_INTO = 70;

/**
 * One full-screen event "page" in the vertical Timeline feed.
 *
 * The flyer IS the card (client feedback 2026-11-08): it fills the card from
 * the top, at full width and its own aspect ratio — never centre-cropped —
 * and fades into a blurred, dimmed copy of itself exactly where the details
 * begin. Company, title, line up and Buy Tickets float over the artwork.
 *
 *   ┌───────────────────────┐
 *   │ (UJ) Company  Follow  │ ← light top scrim for legibility
 *   │                       │
 *   │      FLYER (sharp)    │ ← tap anywhere here to open the event
 *   │                       │
 *   │░░░░ fade ░░░░░░░░░░░░░│ ← starts FADE_LEAD above the details
 *   │ FESTIVAL              │
 *   │ Pop culture festival  │
 *   │ Fri, Aug 28 · Venue   │
 *   │ Description…          │
 *   │ LINE UP  (o) (o) (o)  │ ← translucent tiles over the blurred flyer
 *   │            [Buy] ──── │
 *   └───────────────────────┘
 *
 * "Buy Tickets" opens the organizer's third-party ticketing link (no in-app
 * booking — client feedback 2026-07-26).
 */
export default function EventStepCard({
  event,
  height,
  isFollowing,
  onToggleFollow,
  onOpenEvent,
  onOpenArtist,
  onOpenManager,
}) {
  const org = event.organizer || {};
  const ownerName = org.user?.name || org.handle || 'Event Company';
  const poster = event.bannerImageUrl || (event.flyers && event.flyers[0]) || event.coverImageUrl || null;
  const date = fmtDay(event.startsAt);
  const descNeedsToggle = (event.description || '').length > 90;
  // Buying is disabled once the event has passed, or until the organizer
  // sets a ticketing link.
  const ended = new Date(event.endsAt || event.startsAt).getTime() < Date.now();
  const buyDisabled = ended || !event.ticketUrl;
  // The lineup and the start time already have their own treatment on this
  // card — the pill summarises only what's left, so nothing is said twice.
  const pendingRest = pendingDetails(event).filter(
    (p) => p !== 'Line up' && p !== 'Start time',
  );
  const teaser = pendingRest.length
    ? `${pendingRest.join(' · ')} coming soon — ${TEASER.stayTuned.toLowerCase()}`
    : null;

  // ---- Measurements -------------------------------------------------------
  const [card, setCard] = useState(null); // { w, h }
  const [detailsH, setDetailsH] = useState(0);
  const [ratio, setRatio] = useState(1); // flyer height / width; square until known

  useEffect(() => { setRatio(1); }, [poster]);

  const onCardLayout = useCallback((e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    // Guarded: onLayout can re-fire on every render on some Android versions.
    setCard((prev) => (prev && Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 ? prev : { w, h }));
  }, []);
  const onDetailsLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    setDetailsH((prev) => (Math.abs(prev - h) < 0.5 ? prev : h));
  }, []);
  const onFlyerLoad = useCallback((e) => {
    const src = e?.nativeEvent?.source;
    if (src?.width > 0 && src?.height > 0) {
      const next = src.height / src.width;
      setRatio((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    }
  }, []);

  // Flyer box: full card width, its own aspect ratio, pinned to the top.
  const flyerH = card ? Math.min(card.w * ratio, card.h) : 0;
  const fade = card ? fadeStops(card.h, flyerH, detailsH) : null;

  function handleBuy() {
    if (buyDisabled) return;
    Linking.openURL(event.ticketUrl).catch(() => {});
  }
  const open = () => onOpenEvent && onOpenEvent(event.id);

  return (
    <View style={[styles.page, { height }]}>
      <View style={styles.card} onLayout={onCardLayout}>
        {/* ---- Artwork layers ---- */}
        {poster ? (
          <>
            {/* Backdrop: the same flyer, blurred + dimmed, filling the card —
                so below the flyer it's still "the flyer", never a flat box. */}
            <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={28} />
            <View style={[StyleSheet.absoluteFill, styles.backdropDim]} />
            {card ? (
              <Image
                source={{ uri: poster }}
                onLoad={onFlyerLoad}
                resizeMode="cover"
                style={{ position: 'absolute', top: 0, left: 0, width: card.w, height: card.w * ratio }}
              />
            ) : null}
          </>
        ) : (
          <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={StyleSheet.absoluteFill} />
        )}
        {fade ? (
          <LinearGradient
            pointerEvents="none"
            colors={fade.colors}
            locations={fade.locations}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {/* ---- Content ---- */}
        <View style={styles.content}>
          {/* Company — the headline of the card (no "EVENT BY" label) */}
          <View style={styles.ownerRow}>
            <TouchableOpacity style={styles.ownerMain} activeOpacity={0.8} onPress={() => onOpenManager && onOpenManager(org)}>
              <Avatar uri={org.user?.avatarUrl} name={ownerName} size={38} verified={org.isVerified} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.ownerName, styles.onArt]} numberOfLines={1}>{ownerName}</Text>
                {org.category ? (
                  <Text style={[styles.ownerCat, styles.onArt]} numberOfLines={1}>{org.category}</Text>
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

          {/* The open flyer area — tap anywhere on the artwork to open. */}
          <TouchableOpacity style={styles.artTap} activeOpacity={1} onPress={open} />

          {/* Details — measured, so the fade lands exactly behind them. */}
          <View style={styles.details} onLayout={onDetailsLayout}>
            <TouchableOpacity activeOpacity={0.85} onPress={open} style={styles.headBlock}>
              <View style={styles.tagRow}>
                {event.status === 'live' ? (
                  <View style={styles.liveTag}>
                    <Ionicons name="radio" size={12} color="#000" />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                ) : event.category ? (
                  <View style={styles.catTag}><Text style={styles.catText}>{event.category.toUpperCase()}</Text></View>
                ) : null}
              </View>
              <Text style={[styles.eventName, styles.onArt]} numberOfLines={2}>{event.title}</Text>
              <View style={styles.metaLine}>
                <Ionicons name="calendar-outline" size={13} color="#fff" />
                <Text style={[styles.metaText, !hasStartTime(event) && styles.metaTextPending]}>
                  {date} · {timeLabel(event, { short: true })}
                </Text>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="location-outline" size={13} color="#fff" />
                <Text
                  style={[styles.metaText, !hasVenue(event) && styles.metaTextPending]}
                  numberOfLines={1}
                >
                  {venueLine(event, { withCity: false })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Description — "See more" opens the event page where the full
                text lives (expanding in place kept clipping long text). */}
            {event.description ? (
              <View>
                <Text style={styles.desc} numberOfLines={2}>
                  {event.description}
                </Text>
                {descNeedsToggle ? (
                  <TouchableOpacity activeOpacity={0.7} onPress={open}>
                    <Text style={styles.seeMore}>See more</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {/* This event's line up — never hidden. An event with nothing
                announced yet teases the reveal (client feedback 2026-08-10). */}
            <View style={styles.lineupWrap}>
              <Text style={styles.sectionLabel}>Line Up</Text>
              {hasLineup(event) ? (
                <LineupRow
                  lineup={event.lineup}
                  glass
                  avatarSize={48}
                  onArtistPress={(a) => onOpenArtist && onOpenArtist(a, event)}
                />
              ) : (
                <TouchableOpacity activeOpacity={0.85} style={styles.teaserWrap} onPress={open}>
                  <ComingSoon
                    title={TEASER.lineup}
                    message="Artists are announced soon — stay tuned."
                    icon="musical-notes"
                  />
                </TouchableOpacity>
              )}
              {teaser ? <ComingSoon title={teaser} variant="inline" style={styles.teaserPill} /> : null}
            </View>

            {/* Buy Tickets — compact pill on the right, opens third-party
                ticketing. Disabled (greyed) once the event has passed. */}
            <TouchableOpacity
              style={[styles.bookBtn, buyDisabled && styles.bookBtnEnded]}
              activeOpacity={buyDisabled ? 1 : 0.9}
              disabled={buyDisabled}
              onPress={handleBuy}
            >
              <Ionicons name="ticket" size={14} color={buyDisabled ? 'rgba(255,255,255,0.7)' : '#000'} />
              <Text style={[styles.bookText, buyDisabled && styles.bookTextEnded]}>
                {ended ? 'Event ended' : event.ticketUrl ? 'Buy Tickets' : 'Tickets coming soon'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Gradient stops for the overlay, in card-height fractions:
 *   top scrim (company row legible) → clear flyer → fade → solid base.
 * The fade completes FADE_INTO px inside the details block, or at the
 * flyer's bottom edge if the flyer ends sooner (hiding that hard edge).
 */
function fadeStops(cardH, flyerH, detailsH) {
  if (!cardH) return null;
  const f = (px) => Math.min(Math.max(px / cardH, 0), 1);
  const detailsTop = detailsH ? cardH - detailsH : cardH * 0.55;
  const fadeEndPx = Math.min(detailsTop + FADE_INTO, flyerH || cardH);
  // Top scrim reaches past the company row: busy flyers put text up there.
  const topEnd = f(120);
  let fadeEnd = f(fadeEndPx);
  let fadeStart = f(fadeEndPx - FADE_LEAD - FADE_INTO);
  // Locations must strictly increase.
  fadeStart = Math.max(fadeStart, topEnd + 0.01);
  fadeEnd = Math.max(fadeEnd, fadeStart + 0.01);
  const mid = fadeStart + (fadeEnd - fadeStart) * 0.55;
  // Tuned on real flyers (portrait 4:5 and square): 0.9 at the fade's end
  // keeps body text legible and hides the flyer's bottom edge, while the
  // blurred backdrop's colour still glows through below.
  return {
    colors: [
      'rgba(0,0,0,0.7)',
      'rgba(0,0,0,0.25)',
      'rgba(0,0,0,0)',
      `rgba(${INK},0)`,
      `rgba(${INK},0.55)`,
      `rgba(${INK},0.9)`,
      `rgba(${INK},0.93)`,
    ],
    locations: [0, topEnd * 0.6, topEnd, fadeStart, Math.min(mid, 0.995), Math.min(fadeEnd, 0.997), 1],
  };
}

EventStepCard.propTypes = {
  event: PropTypes.object.isRequired,
  height: PropTypes.number.isRequired,
  isFollowing: PropTypes.bool,
  onToggleFollow: PropTypes.func,
  onOpenEvent: PropTypes.func,
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
  card: {
    flex: 1,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: `rgb(${INK})`,
  },
  backdropDim: { backgroundColor: 'rgba(10,3,3,0.55)' },
  content: { flex: 1, padding: SPACING.md },
  artTap: { flex: 1 },
  details: { gap: SPACING.sm },
  headBlock: { gap: 4 },
  // Soft shadow under text that sits on the artwork.
  onArt: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ownerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  // Company name is the headline — bigger, no "EVENT BY" prefix.
  ownerName: { ...TYPE_SCALE.h4, fontFamily: FONT_FAMILY.headingBold, color: '#fff' },
  ownerCat: {
    fontSize: 10, letterSpacing: 0.8, fontFamily: FONT_FAMILY.bodyMedium,
    color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', marginTop: 1,
  },
  // Compact follow pill — dark glass so it reads on any artwork.
  followBtn: {
    paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderRadius: RADII.pill,
    borderWidth: 1, borderColor: COLORS.accent, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  followBtnActive: { backgroundColor: COLORS.accent },
  followText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  followTextActive: { color: '#000' },

  tagRow: { flexDirection: 'row', marginBottom: 2 },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.highlight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADII.pill,
  },
  liveText: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  catTag: {
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADII.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  catText: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyBold, color: '#fff' },
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
  metaTextPending: { fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accentSoft },

  desc: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  seeMore: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginTop: 2,
  },

  lineupWrap: { gap: SPACING.xs, marginHorizontal: -SPACING.md },
  sectionLabel: {
    ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingBold, color: '#fff',
    letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: SPACING.md,
  },
  // "Revealed soon" blocks sit inside the same gutter as the lineup row.
  teaserWrap: { paddingHorizontal: SPACING.md },
  teaserPill: { marginHorizontal: SPACING.md, marginTop: SPACING.xs },

  // Compact Buy Tickets pill — sits on the right of the card.
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'flex-end', backgroundColor: COLORS.accent,
    paddingVertical: 10, paddingHorizontal: SPACING.xl, borderRadius: RADII.pill,
  },
  bookBtnEnded: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  bookText: { fontSize: 13, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  bookTextEnded: { color: 'rgba(255,255,255,0.8)' },
});
