import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
} from 'react-native';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { EmptyState, Chip, Avatar, ComingSoon } from '../../../shared/components';
import { useEventsData, useAlert, useFollows } from '../../../shared/hooks';
import { TEASER, hasVenue, hasLineup, hasStartTime, timeLabel, venueLine } from '../../../shared/utils';
import EventHero from '../components/EventHero';
import LineupRow from '../components/LineupRow';
import SocialRow from '../components/SocialRow';
import TicketTypeRow from '../components/TicketTypeRow';
import ProfileSheet from '../components/ProfileSheet';
import { eventsByArtistName, eventsByOrganizer } from '../utils/eventDates';

function fmtDate(iso) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleString('en', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  };
}

const EMPTY_SHEET = { visible: false, name: '', subtitle: '', avatarUrl: null, socials: null, relatedEvents: [] };
const DESC_PREVIEW_LINES = 4;

/**
 * Guest event page.
 *
 * Ticketing is entirely third-party: ticket types are display-only (no
 * selection / quantity) and the "Buy Now" CTA opens the organizer's external
 * ticketing link (`event.ticketUrl`). There is no in-app booking fallback —
 * without a link the CTA reads "Tickets coming soon" and stays disabled.
 */
export default function EventDetailScreen({ eventId, onBack, onOpenEvent }) {
  const allEvents = useEventsData();
  const event = useMemo(() => allEvents.find((e) => e.id === eventId) || null, [allEvents, eventId]);
  const [sheet, setSheet] = useState(EMPTY_SHEET);
  const [descExpanded, setDescExpanded] = useState(false);
  const alert = useAlert();
  const { isFollowing, toggle } = useFollows();

  function openArtist(artist) {
    // Surprise slot — show the coming-soon note + this company's upcoming
    // events instead of "No social links added."
    if ((artist?.name || '').trim().toLowerCase() === 'revealed soon') {
      const upcoming = eventsByOrganizer(allEvents, event?.organizer?.id).filter(
        (e) => new Date(e.startsAt).getTime() > Date.now(),
      );
      setSheet({
        visible: true,
        name: 'Revealed Soon',
        subtitle: 'Surprise act',
        avatarUrl: null,
        socials: null,
        note: 'More artists are coming soon from the event companies below.',
        relatedEvents: upcoming,
      });
      return;
    }
    setSheet({
      visible: true,
      name: artist.name,
      subtitle: artist.role || 'Artist',
      avatarUrl: artist.avatarUrl,
      socials: artist.socials,
      relatedEvents: eventsByArtistName(allEvents, artist.name),
    });
  }
  function openManager(orgArg) {
    setSheet({
      visible: true,
      name: orgArg.user?.name || orgArg.handle || 'Event Manager',
      subtitle: orgArg.category || 'Event Manager',
      avatarUrl: orgArg.user?.avatarUrl,
      socials: orgArg.socials,
      relatedEvents: eventsByOrganizer(allEvents, orgArg.id),
    });
  }

  function handleBuy() {
    if (!event) return;
    // Buying is disabled once the event date/time has passed.
    if (new Date(event.endsAt || event.startsAt).getTime() < Date.now()) return;
    // Ticketing is entirely third-party now — the CTA only ever opens the
    // organizer's external platform. The old in-app reservation form is gone
    // (client feedback 2026-07-26); with no link there is nothing to open.
    if (!event.ticketUrl) return;
    Linking.openURL(event.ticketUrl).catch(() =>
      alert.error('Could not open link', 'The ticketing page could not be opened on this device.'),
    );
  }

  async function handleShare() {
    if (!event) return;
    const when = new Date(event.startsAt).toLocaleDateString('en', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    // Unannounced details share as their teaser, never as a dangling "at ,".
    const where = hasVenue(event) ? `${event.venueName}, ${event.cityName}` : TEASER.venue;
    const at = hasStartTime(event) ? `, ${timeLabel(event)}` : ` (${TEASER.time.toLowerCase()})`;
    try {
      await Share.share({
        message: `${event.title} · ${when}${at} · ${where}${event.ticketUrl ? `\nTickets: ${event.ticketUrl}` : ''}`,
        title: event.title,
      });
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  /** Maps only makes sense once there is a venue (or coordinates) to point at. */
  function handleOpenMaps() {
    if (!event || !mappable) return;
    const lat = event.geo?.lat;
    const lng = event.geo?.lng;
    const label = encodeURIComponent(`${event.venueName}, ${event.cityName}`);
    const url =
      lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${label}`;
    Linking.openURL(url).catch(() =>
      alert.error('Could not open maps', 'No map app found on this device.'),
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
        <EmptyState
          icon="alert-circle-outline"
          title="Event not found"
          message="This event may have been removed."
          actionLabel="Go back"
          onAction={onBack}
        />
      </View>
    );
  }

  const org = event.organizer || {};
  const orgName = org.user?.name || org.handle || 'Event Company';
  const orgId = org.id;
  const socials = event.socials || org.socials || null;
  const { weekday, day, month } = fmtDate(event.startsAt);
  // ~4 lines of bodyMd fits ±160 chars — a simple, reliable overflow check
  // (onTextLayout on a clamped <Text> mis-reports on Android).
  const descNeedsToggle = (event.description || '').length > 160;
  const ended = new Date(event.endsAt || event.startsAt).getTime() < Date.now();
  const buyDisabled = ended || !event.ticketUrl;
  // Details the organizer hasn't announced yet are shown as promises, not as
  // blanks (client feedback 2026-08-10).
  const venueKnown = hasVenue(event);
  const lineupKnown = hasLineup(event);
  const timeKnown = hasStartTime(event);
  const mappable = venueKnown || (event.geo?.lat != null && event.geo?.lng != null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <EventHero event={event} onBack={onBack} onShare={handleShare} />

        {/* Bordered page card — thin grey line around the event's content. */}
        <View style={styles.pageCard}>
          {/* Company first — the event company is the focus, event below it. */}
          <View style={styles.orgRow}>
            <TouchableOpacity style={styles.orgMain} activeOpacity={0.8} onPress={() => openManager(org)}>
              <Avatar uri={org.user?.avatarUrl} name={orgName} size={44} verified={org.isVerified} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orgName} numberOfLines={1}>{orgName}</Text>
                {org.category ? <Text style={styles.orgCat} numberOfLines={1}>{org.category}</Text> : null}
              </View>
            </TouchableOpacity>
            {orgId ? (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing(orgId) && styles.followBtnActive]}
                activeOpacity={0.85}
                onPress={() => toggle(orgId)}
              >
                <Text style={[styles.followText, isFollowing(orgId) && styles.followTextActive]}>
                  {isFollowing(orgId) ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date square · title · time */}
          <View style={styles.headerRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateMonth}>{month}</Text>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateWeekday}>{weekday}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle} numberOfLines={3}>{event.title}</Text>
              <View style={styles.metaLine}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={[styles.metaText, !timeKnown && styles.metaTextPending]}>
                  {timeLabel(event)}{timeKnown && event.timezone ? ` · ${event.timezone}` : ''}
                </Text>
              </View>
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text
                  style={[styles.metaText, !venueKnown && styles.metaTextPending]}
                  numberOfLines={1}
                >
                  {venueLine(event)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {event.status === 'live' ? (
              <Chip label="LIVE NOW" variant="live" icon="radio" />
            ) : (
              <Chip label={event.category || 'Event'} variant="filter" active />
            )}
            {event.ageRestriction ? <Chip label={event.ageRestriction} variant="tag" /> : null}
          </View>

          {/* About — expandable "See more" */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About this event</Text>
              <Text
                style={styles.body}
                numberOfLines={descExpanded ? undefined : DESC_PREVIEW_LINES}
              >
                {event.description}
              </Text>
              {descNeedsToggle ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setDescExpanded((v) => !v)}>
                  <Text style={styles.seeMore}>{descExpanded ? 'See less' : 'See more'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Lineup — always shown. Nothing announced yet reads as a promise,
              which is half the reason guests come back to this page. */}
          <View style={styles.section}>
            <Text style={styles.lineupLabel}>Line Up</Text>
            {lineupKnown ? (
              <View style={styles.lineupInset}>
                <LineupRow lineup={event.lineup} onArtistPress={openArtist} />
              </View>
            ) : (
              <ComingSoon
                title={TEASER.lineup}
                message={`${orgName} hasn't announced the artists yet. Follow them and we'll alert you the moment the line up drops.`}
                icon="musical-notes"
              />
            )}
            {socials ? (
              <View style={styles.socialInLineup}>
                <Text style={styles.socialLabel}>Follow on social</Text>
                <SocialRow socials={socials} />
              </View>
            ) : null}
          </View>

          {/* Venue */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Venue</Text>
            {venueKnown ? (
              <>
                <View style={styles.venueCard}>
                  <View style={styles.venueIcon}>
                    <Ionicons name="location" size={20} color={COLORS.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueName}>{event.venueName}</Text>
                    {event.addressLine ? (
                      <Text style={styles.venueAddress} numberOfLines={2}>{event.addressLine}</Text>
                    ) : event.cityName ? (
                      <Text style={styles.venueAddress} numberOfLines={2}>{event.cityName}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.mapBtn} activeOpacity={0.7} onPress={handleOpenMaps}>
                    <Ionicons name="navigate" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenMaps}
                  style={styles.mapPreview}
                >
                  <Ionicons name="map" size={32} color={COLORS.textMuted} />
                  <Text style={styles.mapHint}>Tap to open in Maps</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ComingSoon
                title={TEASER.venue}
                message={
                  event.cityName
                    ? `Somewhere in ${event.cityName} — the exact venue is announced closer to the date. Stay tuned.`
                    : 'The exact venue is announced closer to the date. Stay tuned.'
                }
                icon="location"
              />
            )}
          </View>

          {/* Tickets — display-only (sales happen on the third-party platform) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tickets</Text>
            {/* Types with no price yet still list — each row says "Coming
                soon" — so guests can see what categories exist. */}
            {event.ticketTypes && event.ticketTypes.length ? (
              <>
                {event.ticketTypes.map((t) => (
                  <TicketTypeRow key={t.id} ticket={t} />
                ))}
                {event.ticketUrl ? (
                  <View style={styles.ticketNote}>
                    <Ionicons name="open-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.ticketNoteText}>Tickets are sold on the organizer's ticketing platform.</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <ComingSoon
                title={TEASER.tickets}
                message="Prices and ticket categories are announced soon. Follow the company to be alerted first."
                icon="ticket"
              />
            )}
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating Buy bar — the Buy Now button only. The "Tickets from <price>"
          block was dropped per client feedback 2026-07-26; prices still live in
          the Tickets section above. Disabled once the event has passed, or
          while the organizer hasn't set a ticketing link. */}
      <View style={styles.bookBar}>
        <TouchableOpacity
          style={[styles.buyBtn, buyDisabled && styles.buyBtnEnded]}
          activeOpacity={buyDisabled ? 1 : 0.9}
          disabled={buyDisabled}
          onPress={handleBuy}
        >
          <Ionicons name="ticket" size={15} color={buyDisabled ? COLORS.textMuted : '#000'} />
          <Text style={[styles.buyText, buyDisabled && styles.buyTextEnded]}>
            {ended ? 'Event ended' : event.ticketUrl ? 'Buy Now' : 'Tickets coming soon'}
          </Text>
        </TouchableOpacity>
      </View>

      <ProfileSheet
        {...sheet}
        onClose={() => setSheet(EMPTY_SHEET)}
        onOpenEvent={(id) => {
          setSheet(EMPTY_SHEET);
          if (id !== eventId && onOpenEvent) onOpenEvent(id);
        }}
      />
    </View>
  );
}

EventDetailScreen.propTypes = {
  eventId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onOpenEvent: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  scroll: { paddingBottom: SPACING.xxl },
  // Thin grey border around the whole event page content.
  pageCard: {
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.bgStrong,
  },
  headerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
  },
  eventTitle: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: SPACING.xs,
  },
  dateBadge: {
    backgroundColor: '#fff',
    borderRadius: RADII.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    minWidth: 64,
    alignSelf: 'flex-start',
  },
  dateMonth: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accent },
  dateDay: { fontSize: 22, fontFamily: FONT_FAMILY.headingBold, color: COLORS.ink, marginVertical: -2 },
  dateWeekday: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.inkMuted },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  // "Revealed soon" reads as a teaser, not as real data.
  metaTextPending: { color: COLORS.accent, fontFamily: FONT_FAMILY.bodySemiBold },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
  },
  orgMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  // Company name is the headline of the page — bigger than before.
  orgName: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  orgCat: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  // Follow pill — deliberately compact.
  followBtn: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  followBtnActive: { backgroundColor: COLORS.accent },
  followText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  followTextActive: { color: '#000' },
  socialInLineup: {
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  socialLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
  },
  sectionLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  // Line Up heading — larger + bolder so it never reads clipped.
  lineupLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  lineupInset: { marginHorizontal: -SPACING.base },
  body: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  seeMore: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginTop: SPACING.xs,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    marginBottom: SPACING.sm,
  },
  venueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,59,59,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  venueAddress: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreview: {
    height: 120,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapHint: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  ticketNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  ticketNoteText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    flex: 1,
  },
  bookBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(5,5,5,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
  },
  // Buy Now owns the whole bar now that the price block is gone.
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    height: 48,
    borderRadius: RADII.pill,
  },
  buyText: { fontSize: 15, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  buyBtnEnded: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  buyTextEnded: { color: COLORS.textMuted },
});
