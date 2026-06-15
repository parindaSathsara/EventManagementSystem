import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Button, Input, EmptyState, ScreenHeader } from '../../../shared/components';
import { useEventsData, useAlert, useUser } from '../../../shared/hooks';
import { eventsRepo } from '../../../services';
import { tickets as ticketsApi } from '../../../services/api';
import TicketTypeRow from '../components/TicketTypeRow';

/**
 * Guest-capable booking page. Reached from a flyer CTA or the event detail
 * Book button. A logged-in manager books against their account; a guest fills
 * in name + phone (+ optional email) and we reserve via /tickets/reserve.
 */
export default function BookingScreen({ eventId, ticketTypeId, onBack, onDone }) {
  const allEvents = useEventsData();
  const { user } = useUser();
  const alert = useAlert();

  const event = useMemo(() => allEvents.find((e) => e.id === eventId) || null, [allEvents, eventId]);
  const [selected, setSelected] = useState(
    ticketTypeId || (event?.ticketTypes?.[0]?.id ?? null),
  );
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [booking, setBooking] = useState(false);

  if (!event) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
        <ScreenHeader title="Booking" onBack={onBack} />
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

  const tt = event.ticketTypes.find((t) => t.id === selected);
  const isGuest = !user;
  const canBook =
    !!tt &&
    tt.remaining > 0 &&
    name.trim().length > 0 &&
    (!isGuest || phone.trim().length >= 4);

  async function handleConfirm() {
    if (booking || !canBook) return;
    setBooking(true);
    try {
      const ticket = await ticketsApi.reserve({
        eventId: event.id,
        ticketTypeId: tt.id,
        holderName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      await eventsRepo.decrementTicket(event.id, tt.id, 1);
      const isFree = (tt.priceLabel || '').toLowerCase() === 'free';
      alert.success(
        isFree ? 'Reserved' : 'Booked',
        `${tt.name} for ${event.title} is confirmed. We'll remind you before the show.`,
        () => onDone && onDone(ticket?.id),
      );
    } catch (err) {
      alert.error('Booking failed', err?.message || 'Could not complete the reservation. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const d = new Date(event.startsAt);
  const when = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Book tickets" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Event summary */}
        <View style={styles.summary}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.eventMeta}>{when} · {time}</Text>
          <Text style={styles.eventMeta}>{event.venueName} · {event.cityName}</Text>
        </View>

        {/* Ticket tiers */}
        <Text style={styles.sectionLabel}>Choose a ticket</Text>
        {event.ticketTypes.map((t) => (
          <TicketTypeRow
            key={t.id}
            ticket={t}
            selected={t.id === selected}
            onPress={() => setSelected(t.id)}
          />
        ))}

        {/* Contact details */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
          {isGuest ? 'Your details' : 'Booking as'}
        </Text>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+94 7X XXX XXXX"
          keyboardType="phone-pad"
        />
        <Input
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        {isGuest ? (
          <Text style={styles.guestHint}>
            No account needed — we’ll use these details to confirm your reservation.
          </Text>
        ) : null}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Confirm bar */}
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>{tt ? tt.name : 'Select a ticket'}</Text>
          <Text style={styles.barPrice}>{tt ? tt.priceLabel : '—'}</Text>
        </View>
        <Button
          title={booking ? 'Booking…' : tt && tt.remaining === 0 ? 'Sold out' : 'Confirm'}
          variant="primary"
          disabled={!canBook || booking}
          loading={booking}
          onPress={handleConfirm}
          style={styles.barBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

BookingScreen.propTypes = {
  eventId: PropTypes.string.isRequired,
  ticketTypeId: PropTypes.string,
  onBack: PropTypes.func,
  onDone: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.xxl },
  summary: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 3,
  },
  eventTitle: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  eventMeta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  sectionLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  guestHint: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: -SPACING.xs,
  },
  bar: {
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
  barLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  barPrice: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  barBtn: {
    paddingHorizontal: SPACING.xl,
    height: 48,
  },
});
