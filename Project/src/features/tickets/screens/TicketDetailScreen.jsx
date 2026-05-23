import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Button, Chip, ScreenHeader, EmptyState } from '../../../shared/components';
import { useTicketsData } from '../../../shared/hooks';
import QRPlaceholder from '../components/QRPlaceholder';

function format(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TicketDetailScreen({ ticketId, onBack, onOpenEvent }) {
  const all = useTicketsData();
  const ticket = useMemo(() => all.find((t) => t.id === ticketId) || null, [all, ticketId]);

  if (!ticket || !ticket.event) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
        <ScreenHeader title="Ticket" onBack={onBack} />
        <EmptyState
          icon="alert-circle-outline"
          title="Ticket unavailable"
          message="This ticket might have been refunded or expired."
        />
      </View>
    );
  }

  const event = ticket.event;
  const used = ticket.status === 'used';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Your Ticket" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            {used ? (
              <Chip label="USED" variant="tag" icon="checkmark-done" />
            ) : (
              <Chip label="ACTIVE" variant="verified" icon="shield-checkmark-outline" />
            )}
            <Text style={styles.ticketId}>#{ticket.id.slice(-6).toUpperCase()}</Text>
          </View>

          <View style={styles.qrWrap}>
            <QRPlaceholder value={ticket.qrPayload} size={220} />
          </View>

          <Text style={styles.qrHint}>
            Show this code at the entrance. Brightness will auto-increase.
          </Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventCategory}>{event.category}</Text>

          <View style={styles.divider} />

          <Row icon="calendar-outline" label="Starts" value={format(event.startsAt)} />
          <Row icon="location-outline" label="Venue" value={`${event.venueName}, ${event.cityName}`} />
          <Row icon="ticket-outline" label="Ticket type" value={ticket.typeName} />
          <Row icon="person-outline" label="Holder" value={ticket.holderName} />
          {event.ageRestriction ? (
            <Row icon="alert-circle-outline" label="Age" value={event.ageRestriction} />
          ) : null}
        </View>

        <Button
          title="View event details"
          variant="secondary"
          onPress={() => onOpenEvent && onOpenEvent(event.id)}
          style={{ marginHorizontal: SPACING.base, marginTop: SPACING.md }}
        />

        <View style={styles.policyCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.policyText}>
            Refunds and re-issues are available from the event organizer up to 24h before start.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

Row.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
};

TicketDetailScreen.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onOpenEvent: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  scroll: { paddingBottom: SPACING.xxl },
  qrCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  ticketId: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  qrWrap: {
    padding: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: RADII.md,
    marginBottom: SPACING.md,
  },
  qrHint: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  detailCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  eventTitle: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  eventCategory: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lineSubtle,
    marginVertical: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  rowLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    width: 70,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rowValue: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  policyCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  policyText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
