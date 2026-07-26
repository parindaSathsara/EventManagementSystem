import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError, EmptyState, Avatar } from '../../../shared/components';
import {
  useNotificationsData,
  useEventsData,
  useFollows,
  useUnseenAlerts,
} from '../../../shared/hooks';
import { notificationScheduler } from '../../../services';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

/**
 * Alerts tab.
 *
 *  - "New from companies you follow": fresh events published by followed
 *    companies (the follow → publish alert).
 *  - Reminder feed from the backend (T-1 … T-5, five days' notice) — every
 *    card shows the event company name.
 *  - On-device local notifications are (re)scheduled for followed events.
 */
export default function NotificationsScreen({ onOpenEvent }) {
  const items = useNotificationsData();
  const events = useEventsData();
  const { ids, isFollowing } = useFollows();
  const { newFromFollowed } = useUnseenAlerts();

  // (Re)schedule local reminders whenever follows or events change.
  const followedUpcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e?.organizer?.id && isFollowing(e.organizer.id))
      .filter((e) => new Date(e.startsAt).getTime() > now)
      .map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        venueName: e.venueName,
        companyName: e.organizer?.user?.name || e.organizer?.handle,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, ids]);

  useEffect(() => {
    notificationScheduler.syncReminders(followedUpcoming).catch(() => {});
  }, [followedUpcoming]);

  const hasAnything = items.length > 0 || newFromFollowed.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={items.refresh} tintColor={COLORS.accent} />
        }
      >
        {items.error && !hasAnything ? (
          <ConnectionError error={items.error} onRetry={items.refresh} loading={items.loading} />
        ) : !hasAnything ? (
          <EmptyState
            icon="notifications-outline"
            title="You're all caught up"
            message="Reminders for events happening in the next 5 days show up here. Follow a company to get alerted when they publish a new event."
          />
        ) : (
          <>
            {/* Follow → publish alerts */}
            {newFromFollowed.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>New from companies you follow</Text>
                {newFromFollowed.map((e) => (
                  <PublishCard key={`pub-${e.id}`} event={e} onPress={() => onOpenEvent && onOpenEvent(e.id)} />
                ))}
              </>
            ) : null}

            {/* Reminder feed */}
            {items.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Coming up</Text>
                {items.map((n) => (
                  <ReminderCard key={n.id} item={n} onPress={() => onOpenEvent && onOpenEvent(n.eventId)} />
                ))}
              </>
            ) : null}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

/** "Company published / updated an event" card. */
function PublishCard({ event, onPress }) {
  const org = event.organizer || {};
  const company = org.user?.name || org.handle || 'Event Company';
  const d = new Date(event.startsAt);
  const when = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  // Edited after publish (surprise artists revealed, prices changed, …) —
  // the event re-surfaces here with an "Updated" message.
  const wasUpdated =
    new Date(event.updatedAt || 0).getTime() - new Date(event.createdAt || 0).getTime() > 60 * 1000;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Avatar uri={org.user?.avatarUrl} name={company} size={40} verified={org.isVerified} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardCompany} numberOfLines={1}>{company}</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {wasUpdated ? 'Updated their event' : 'Published a new event'} · {when}
        </Text>
      </View>
      <View style={styles.newPill}>
        <Text style={styles.newPillText}>{wasUpdated ? 'UPDATED' : 'NEW'}</Text>
      </View>
    </TouchableOpacity>
  );
}

/** T-N reminder card — always shows the event company. */
function ReminderCard({ item, onPress }) {
  const d = new Date(item.startsAt);
  const when = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  const urgent = item.daysUntil === 1;
  const badgeLabel = urgent ? 'Tomorrow' : `In ${item.daysUntil} days`;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.badge, urgent ? styles.badgeUrgent : styles.badgeSoon]}>
        <Ionicons name="alarm-outline" size={16} color={urgent ? '#000' : COLORS.accent} />
        <Text style={[styles.badgeText, urgent && styles.badgeTextUrgent]}>{badgeLabel}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {item.companyName ? (
          <Text style={styles.cardCompany} numberOfLines={1}>{item.companyName}</Text>
        ) : null}
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{when} · {time}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{item.venueName}{item.cityName ? ` · ${item.cityName}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

PublishCard.propTypes = { event: PropTypes.object.isRequired, onPress: PropTypes.func };
ReminderCard.propTypes = { item: PropTypes.object.isRequired, onPress: PropTypes.func };

NotificationsScreen.propTypes = {
  onOpenEvent: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  header: {
    paddingTop: TOP,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Matches the Timeline "For You / Following" tab style per client feedback.
  title: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  card: {
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
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.sm || 10,
    minWidth: 72,
  },
  badgeUrgent: { backgroundColor: COLORS.highlight },
  badgeSoon: { backgroundColor: 'rgba(255,59,59,0.14)' },
  badgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  badgeTextUrgent: { color: '#000' },
  cardCompany: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  cardMeta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  newPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  newPillText: { fontSize: 9, letterSpacing: 0.8, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
});
