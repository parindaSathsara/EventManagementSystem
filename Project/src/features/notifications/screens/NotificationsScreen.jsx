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
  usePushNotifications,
  useAlert,
} from '../../../shared/hooks';
import { hasStartTime, timeLabel, venueLine } from '../../../shared/utils';
import { push as pushService } from '../../../services';

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
 *  - A settings row on top owns the OS-level half: permission, the push
 *    token, and the guest's on/off switch.
 *  - On-device local notifications are (re)scheduled for followed events,
 *    which is what makes reminders fire with the app closed.
 */
export default function NotificationsScreen({ onOpenEvent }) {
  const items = useNotificationsData();
  const events = useEventsData();
  const { ids, isFollowing } = useFollows();
  const { newFromFollowed } = useUnseenAlerts();
  const notifications = usePushNotifications();
  const alert = useAlert();
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
        // Without this the day-of nudge would fire "2 hours before" a
        // placeholder noon on events whose time isn't announced yet.
        startTimeTba: e.startTimeTba,
        venueName: e.venueName,
        companyName: e.organizer?.user?.name || e.organizer?.handle,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, ids]);

  // Re-arm the OS alarms whenever the follow list or the events behind it
  // change — and when the guest flips the switch, since turning alerts off
  // has to cancel what's already scheduled.
  useEffect(() => {
    pushService.syncReminders(followedUpcoming).catch(() => {});
  }, [followedUpcoming, notifications.on]);

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

      {/* The OS-level switch. Always visible: a guest who thinks alerts are
          broken needs to find the reason here, not guess. */}
      <PushSettingsRow
        state={notifications}
        onTest={async () => {
          try {
            await notifications.sendTest();
            alert.success('Sent', 'Check your notification tray in a second.');
          } catch (e) {
            alert.error('Could not send', e?.message || 'Please try again.');
          }
        }}
      />

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
        style={styles.feed}
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

/**
 * Push on/off row.
 *
 * Collapses (permission × push token × the guest's own switch) into one line
 * and one button. The distinction that matters to a guest is *who* turned
 * alerts off: if the OS did, the button has to send them to system settings,
 * because the app is no longer allowed to ask.
 */
function PushSettingsRow({ state, onTest }) {
  // Nothing to configure in a build without the native module (web, or an
  // Expo Go client that dropped it) — don't show a control that can't work.
  if (!state.supported) return null;

  const blocked = state.permission === 'denied';
  const on = state.on;

  return (
    <View style={styles.pushRow}>
      <View style={[styles.pushIcon, on && styles.pushIconOn]}>
        <Ionicons
          name={on ? 'notifications' : blocked ? 'notifications-off' : 'notifications-outline'}
          size={18}
          color={on ? '#000' : COLORS.textMuted}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.pushTitle}>Push notifications</Text>
        <Text style={styles.pushSummary} numberOfLines={2}>
          {state.summary}
        </Text>
      </View>

      {/* Only offer the test once there's a server-reachable token to test. */}
      {on && state.remote ? (
        <TouchableOpacity
          style={styles.pushTest}
          disabled={state.busy}
          onPress={onTest}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pushTestText}>Test</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.pushToggle, on && styles.pushToggleOn]}
        disabled={state.busy}
        activeOpacity={0.85}
        onPress={() => (on ? state.disable() : state.enable())}
      >
        <Text style={[styles.pushToggleText, on && styles.pushToggleTextOn]}>
          {state.busy ? '…' : on ? 'On' : blocked ? 'Settings' : 'Turn on'}
        </Text>
      </TouchableOpacity>
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
PushSettingsRow.propTypes = {
  state: PropTypes.object.isRequired,
  onTest: PropTypes.func.isRequired,
};

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
  // Push settings row — reads as a setting, not as another alert card: no
  // full-width surface, just a hairline rule under the header.
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  pushIcon: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
  },
  pushIconOn: { backgroundColor: COLORS.accent },
  pushTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  pushSummary: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  pushTest: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  pushTestText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  pushToggle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineStrong,
    minWidth: 68,
    alignItems: 'center',
  },
  pushToggleOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pushToggleText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textPrimary,
  },
  pushToggleTextOn: { color: '#000' },
  // A ScrollView defaults to flexShrink: 1 — horizontal ones too. Sitting in
  // a fixed-height column above a long feed, the strip was being squeezed
  // below the chips' 32px (clipping them top and bottom), and by a different
  // amount every time a filter changed the feed length (so the chips seemed
  // to resize on tap). Never grow, never shrink: always its natural height.
  filterBar: { flexGrow: 0, flexShrink: 0, marginBottom: SPACING.xs },
  filterStrip: {
    paddingHorizontal: SPACING.base,
    // Room so the chip borders are never cut by the scroll viewport edge.
    paddingVertical: 2,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  // The feed takes whatever height is left below the header and filters.
  feed: { flex: 1 },
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
