import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Chip, ScreenHeader, EmptyState } from '../../../shared/components';
import { useTicketsData, useAlert } from '../../../shared/hooks';

function formatLocal(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TicketCard({ ticket, onPress }) {
  const event = ticket.event;
  if (!event) return null;
  const isLive = event.status === 'live';
  const statusLabel =
    ticket.status === 'used'
      ? 'USED'
      : ticket.isPast
      ? 'EXPIRED'
      : isLive
      ? 'LIVE NOW'
      : 'CONFIRMED';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.ticket}>
      <View style={[styles.stripe, ticket.status === 'used' && styles.stripeMuted]} />
      <View style={{ flex: 1 }}>
        <View style={styles.statusRow}>
          {isLive ? (
            <Chip label={statusLabel} variant="live" icon="radio" />
          ) : (
            <Chip label={statusLabel} variant={ticket.status === 'used' ? 'tag' : 'verified'} icon={ticket.status === 'used' ? 'checkmark-done' : 'shield-checkmark-outline'} />
          )}
          <Text style={styles.ticketId}>#{ticket.id.slice(-4)}</Text>
        </View>
        <Text style={styles.ticketTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.meta}>{formatLocal(event.startsAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>{event.venueName}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.ticketTypeLabel}>{ticket.typeName}</Text>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

TicketCard.propTypes = {
  ticket: PropTypes.object.isRequired,
  onPress: PropTypes.func,
};

export default function TicketsScreen({ onOpenTicket }) {
  const [tab, setTab] = useState('upcoming');
  const all = useTicketsData();
  const alert = useAlert();

  const upcoming = all.filter((t) => !t.isPast && t.status !== 'used');
  const past = all.filter((t) => t.isPast || t.status === 'used');

  const items = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title="My Tickets"
        subtitle={`${all.length} total`}
        rightIcon="qr-code-outline"
        onRightPress={() =>
          alert.info(
            'Scan ticket',
            'Point your camera at a QR ticket to validate entry. Scanner is unlocked for venue staff.',
          )
        }
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, tab === 'upcoming' && styles.tabLabelActive]}>
            Upcoming · {upcoming.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, tab === 'past' && styles.tabLabelActive]}>
            Past · {past.length}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyState
            icon="ticket-outline"
            title={tab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
            message="Browse the calendar and reserve your spot."
          />
        ) : (
          items.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              onPress={() => onOpenTicket && onOpenTicket(t.id)}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

TicketsScreen.propTypes = {
  onOpenTicket: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textSecondary,
  },
  tabLabelActive: { color: '#000' },
  list: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  ticket: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  stripe: {
    width: 6,
    backgroundColor: COLORS.accent,
  },
  stripeMuted: { backgroundColor: COLORS.lineStrong },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  ticketId: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  ticketTitle: {
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    marginTop: 4,
  },
  meta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
    borderStyle: 'dashed',
    marginTop: SPACING.md,
  },
  ticketTypeLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
