import React, { useEffect, useMemo, useState } from 'react';
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
import { ConnectionError, EmptyState, Avatar, Chip } from '../../../shared/components';
import {
  useNotificationsData,
  useEventsData,
  useFollows,
  useUnseenAlerts,
} from '../../../shared/hooks';
import { hasStartTime, timeLabel, venueLine } from '../../../shared/utils';
import { notificationScheduler } from '../../../services';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

// "Coming up" leads and is the default view — the reminders for events that
// are actually about to happen are what guests open this tab for. Everything
// else is one tap away instead of pushing them down the page (client feedback
// 2026-08-10).
const FILTERS = [
  { key: 'upcoming', label: 'Coming up' },
  { key: 'new', label: 'New events' },
  { key: 'all', label: 'All' },
];
const ALL_COMPANIES = '__all__';

/**
 * Alerts tab.
 *
 *  - "Coming up": the backend reminder feed (T-1 … T-5, five days' notice) —
 *    shown first, and the default filter.
 *  - "New events": fresh events published/updated by followed companies.
 *  - Both can be narrowed to a single event manager, so following a busy
 *    company doesn't bury the rest.
 *  - On-device local notifications are (re)scheduled for followed events.
 */
export default function NotificationsScreen({ onOpenEvent }) {
  const items = useNotificationsData();
  const events = useEventsData();
  const { ids, isFollowing } = useFollows();
  const { newFromFollowed } = useUnseenAlerts();
  // `null` = the guest hasn't chosen a filter, so we pick the best one for
  // them (see `activeFilter`). Once they tap a chip we respect it exactly.
  const [filter, setFilter] = useState(null);
  const [company, setCompany] = useState(ALL_COMPANIES);

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

  /** Event managers appearing anywhere in the alerts — the company filter. */
  const companies = useMemo(() => {
    const byId = new Map();
    items.forEach((n) => {
      if (n.companyId && !byId.has(n.companyId)) {
        byId.set(n.companyId, { id: n.companyId, name: n.companyName || 'Event Company' });
      }
    });
    newFromFollowed.forEach((e) => {
      const org = e.organizer || {};
      if (org.id && !byId.has(org.id)) {
        byId.set(org.id, { id: org.id, name: org.user?.name || org.handle || 'Event Company' });
      }
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, newFromFollowed]);

  // A company that drops out of the feed must not leave the list filtered to
  // nothing.
  useEffect(() => {
    if (company !== ALL_COMPANIES && !companies.some((c) => c.id === company)) {
      setCompany(ALL_COMPANIES);
    }
  }, [companies, company]);

  const matchesCompany = (id) => company === ALL_COMPANIES || id === company;
  const reminders = useMemo(
    () => items.filter((n) => matchesCompany(n.companyId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, company],
  );
  const publishes = useMemo(
    () => newFromFollowed.filter((e) => matchesCompany(e.organizer?.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newFromFollowed, company],
  );

  // "Coming up" leads whenever there is anything coming up; with no reminders
  // due we open on everything instead of showing an empty page while new-event
  // alerts sit one tap away.
  const activeFilter = filter || (items.length > 0 ? 'upcoming' : 'all');
  const showUpcoming = activeFilter === 'upcoming' || activeFilter === 'all';
  const showNew = activeFilter === 'new' || activeFilter === 'all';
  const hasAnything = items.length > 0 || newFromFollowed.length > 0;
  const visibleCount =
    (showUpcoming ? reminders.length : 0) + (showNew ? publishes.length : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
      </View>

      {/* Filters — pinned above the feed so the page never has to be scrolled
          to reach them. */}
      {hasAnything ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterStrip}
          >
            {FILTERS.map((f) => {
              const count =
                f.key === 'upcoming'
                  ? reminders.length
                  : f.key === 'new'
                    ? publishes.length
                    : reminders.length + publishes.length;
              return (
                <Chip
                  key={f.key}
                  label={count ? `${f.label} · ${count}` : f.label}
                  active={activeFilter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              );
            })}
          </ScrollView>

          {companies.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterBar}
              contentContainerStyle={styles.filterStrip}
            >
              <Chip
                label="All companies"
                active={company === ALL_COMPANIES}
                onPress={() => setCompany(ALL_COMPANIES)}
              />
              {companies.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={company === c.id}
                  onPress={() => setCompany(c.id)}
                />
              ))}
            </ScrollView>
          ) : null}
        </>
      ) : null}

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
        ) : visibleCount === 0 ? (
          <EmptyState
            icon="funnel-outline"
            title="Nothing in this filter"
            message="No alerts match what you picked above."
            actionLabel="Show all alerts"
            onAction={() => {
              setFilter('all');
              setCompany(ALL_COMPANIES);
            }}
          />
        ) : (
          <>
            {/* Coming up leads — these are the time-critical ones. */}
            {showUpcoming && reminders.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Coming up</Text>
                {reminders.map((n) => (
                  <ReminderCard key={n.id} item={n} onPress={() => onOpenEvent && onOpenEvent(n.eventId)} />
                ))}
              </>
            ) : null}

            {/* Follow → publish alerts */}
            {showNew && publishes.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>New from companies you follow</Text>
                {publishes.map((e) => (
                  <PublishCard key={`pub-${e.id}`} event={e} onPress={() => onOpenEvent && onOpenEvent(e.id)} />
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
  const time = timeLabel(item, { short: true });
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
        <Text style={[styles.cardMeta, !hasStartTime(item) && styles.cardMetaPending]} numberOfLines={1}>
          {when} · {time}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{venueLine(item)}</Text>
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
  filterBar: { flexGrow: 0, marginBottom: SPACING.xs },
  filterStrip: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    alignItems: 'center',
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
  // Unannounced time reads as a teaser, not as real data.
  cardMetaPending: { color: COLORS.accent, fontFamily: FONT_FAMILY.bodyBold },
  newPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  newPillText: { fontSize: 9, letterSpacing: 0.8, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
});
