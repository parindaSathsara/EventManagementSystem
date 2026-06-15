import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Button, EmptyState, SectionHeader, Chip, Avatar } from '../../../shared/components';
import { useEventsData, useAlert, useFollows } from '../../../shared/hooks';
import { eventsRepo, ticketsRepo } from '../../../services';
import EventHero from '../components/EventHero';
import LineupRow from '../components/LineupRow';
import SocialRow from '../components/SocialRow';
import TicketTypeRow from '../components/TicketTypeRow';

function fmtDate(iso) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleString('en', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function EventDetailScreen({ eventId, onBack, onArtistPress, onBook, onBookConfirmed }) {
  const allEvents = useEventsData();
  const event = useMemo(() => allEvents.find((e) => e.id === eventId) || null, [allEvents, eventId]);
  const [selectedTicket, setSelectedTicket] = useState(
    event && event.ticketTypes && event.ticketTypes.length ? event.ticketTypes[0].id : null,
  );
  // Booking is in-flight when this is true — the Book button is disabled
  // and a second tap is a no-op. Prevents the double-purchase race we saw
  // in the load test (5 simultaneous taps = 5 tickets created).
  const [booking, setBooking] = useState(false);
  const alert = useAlert();
  const { isFollowing, toggle } = useFollows();

  async function handleBook() {
    // Guest flow: hand off to the dedicated BookingScreen (captures contact
    // details and reserves without an account). Manager/authed flow keeps the
    // inline purchase below.
    if (onBook) {
      onBook(event.id, selectedTicket);
      return;
    }
    if (booking) return; // guard against re-entry from a fast double-tap
    if (!event || !selectedTicket) return;
    const tt = event.ticketTypes.find((t) => t.id === selectedTicket);
    if (!tt || tt.remaining === 0) return;
    setBooking(true);
    try {
      const ticket = await ticketsRepo.create({
        eventId: event.id,
        typeName: tt.name,
      });
      // Backend has already decremented stock; this mirrors it locally so
      // the UI reflects the new count before the next /events fetch.
      await eventsRepo.decrementTicket(event.id, tt.id, 1);
      const isFree = (tt.priceLabel || '').toLowerCase() === 'free';
      alert.success(
        isFree ? 'Reserved' : 'Ticket booked',
        `${tt.name} for ${event.title} is now in your wallet.`,
        () => onBookConfirmed && onBookConfirmed(ticket.id),
      );
    } catch (err) {
      alert.error('Booking failed', err?.message || 'Could not book this ticket. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  function handleSaveToggle() {
    if (!event) return;
    eventsRepo.toggleSave(event.id);
  }

  function handleOpenMaps() {
    if (!event) return;
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

  const selected = event.ticketTypes.find((t) => t.id === selectedTicket);
  const canBook = !!selected && selected.remaining > 0;

  const org = event.organizer || {};
  const orgName = org.user?.name || org.handle || 'Event Company';
  const orgId = org.id;
  const socials = event.socials || org.socials || null;
  const { weekday, day, month, time } = fmtDate(event.startsAt);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <EventHero event={event} onBack={onBack} onSave={handleSaveToggle} />

        {/* Title · date · venue */}
        <View style={styles.headerBlock}>
          <View style={styles.tagsRow}>
            {event.status === 'live' ? (
              <Chip label="LIVE NOW" variant="live" icon="radio" />
            ) : (
              <Chip label={event.category || 'Event'} variant="filter" active />
            )}
            {event.ageRestriction ? <Chip label={event.ageRestriction} variant="tag" /> : null}
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateMonth}>{month}</Text>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateWeekday}>{weekday}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.metaLine}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{time}{event.timezone ? ` · ${event.timezone}` : ''}</Text>
              </View>
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.venueName} · {event.cityName}
                </Text>
              </View>
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.orgRow}>
            <Avatar uri={org.user?.avatarUrl} name={orgName} size={40} verified={org.isVerified} />
            <View style={{ flex: 1 }}>
              <Text style={styles.orgName} numberOfLines={1}>{orgName}</Text>
              {org.category ? <Text style={styles.orgCat} numberOfLines={1}>{org.category}</Text> : null}
            </View>
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
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About this event</Text>
          <Text style={styles.body}>{event.description}</Text>
        </View>

        {/* Lineup */}
        <View>
          <SectionHeader title="Lineup" />
          <LineupRow
            lineup={event.lineup}
            onArtistPress={onArtistPress}
          />
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
          <View style={styles.venueCard}>
            <View style={styles.venueIcon}>
              <Ionicons name="location" size={20} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.venueName}>{event.venueName}</Text>
              <Text style={styles.venueAddress} numberOfLines={2}>{event.addressLine}</Text>
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
        </View>

        {/* Tickets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tickets</Text>
          {event.ticketTypes.map((t) => (
            <TicketTypeRow
              key={t.id}
              ticket={t}
              selected={t.id === selectedTicket}
              onPress={() => setSelectedTicket(t.id)}
            />
          ))}
        </View>

        {/* Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cancellation & refunds</Text>
          <View style={styles.policyCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.highlight} />
            <Text style={styles.policyText}>
              {event.cancellationPolicy || 'Cancellation policy will be displayed at booking.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating Book bar */}
      <View style={styles.bookBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookLabel}>{selected ? selected.name : 'Select a ticket'}</Text>
          <Text style={styles.bookPrice}>{selected ? selected.priceLabel : '—'}</Text>
        </View>
        <Button
          title={
            booking
              ? 'Booking…'
              : canBook
              ? (selected.priceLabel.toLowerCase() === 'free' ? 'Reserve' : 'Book now')
              : 'Sold out'
          }
          variant="primary"
          // disable while a purchase is in flight so a double-tap can't
          // create two tickets — the backend has no per-request idempotency.
          disabled={!canBook || booking}
          loading={booking}
          onPress={handleBook}
          style={styles.bookBtn}
        />
      </View>
    </View>
  );
}

EventDetailScreen.propTypes = {
  eventId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onArtistPress: PropTypes.func,
  onBook: PropTypes.func,
  onBookConfirmed: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  scroll: { paddingBottom: SPACING.xxl },
  headerBlock: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  tagsRow: { flexDirection: 'row', gap: SPACING.sm },
  eventTitle: {
    ...TYPE_SCALE.h2,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dateBadge: {
    backgroundColor: '#fff',
    borderRadius: RADII.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    minWidth: 64,
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
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
  },
  orgName: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
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
  followBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  followBtnActive: { backgroundColor: COLORS.accent },
  followText: { fontSize: 12, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  followTextActive: { color: '#000' },
  socialInLineup: {
    paddingHorizontal: SPACING.base,
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
  body: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
    backgroundColor: 'rgba(255,84,130,0.12)',
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
  policyCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,255,161,0.06)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,161,0.2)',
  },
  policyText: {
    flex: 1,
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  bookLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bookPrice: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  bookBtn: {
    paddingHorizontal: SPACING.xl,
    height: 48,
  },
});
