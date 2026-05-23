import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Chip,
  EmptyState,
  TopBar,
} from '../../../shared/components';
import { useEventsData, useAlert, useUser } from '../../../shared/hooks';
import { eventsRepo } from '../../../services';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'past', label: 'Past' },
  { key: 'drafts', label: 'Drafts' },
];

const DATE_FILTERS = [
  { key: 'any', label: 'Any date' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'later', label: 'Later' },
];

function startOfDay(d = new Date()) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function rangeFor(key) {
  const now = new Date();
  const today = startOfDay(now).getTime();
  switch (key) {
    case 'today':
      return { from: today, to: today + 24 * 3600 * 1000 };
    case 'week':
      return { from: today, to: today + 7 * 24 * 3600 * 1000 };
    case 'month': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      return { from: today, to: end };
    }
    case 'later': {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      return { from: monthEnd, to: Infinity };
    }
    case 'any':
    default:
      return { from: -Infinity, to: Infinity };
  }
}

function fmtDate(iso) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
    weekday: d.toLocaleString('en', { weekday: 'short' }).toUpperCase(),
  };
}

export default function MyEventsScreen({
  onCreateEvent,
  onOpenEvent,
  onOpenSearch,
  onOpenCalendar,
  onOpenNotifications,
  onOpenProfile,
}) {
  const [tab, setTab] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [dateKey, setDateKey] = useState('any');
  const allEvents = useEventsData();
  const alert = useAlert();
  const { user, artist } = useUser();

  const all = useMemo(
    () =>
      artist
        ? allEvents.filter((e) => e.organizerArtistId === artist.id)
        : [],
    [allEvents, artist],
  );

  function handleEdit(event) {
    alert.info('Edit event', `Editing "${event.title}" — full editor coming next sprint.`);
  }
  function handleReschedule(event) {
    alert.info(
      'Reschedule',
      `Pick a new date for "${event.title}". Customers with tickets will be notified automatically.`,
    );
  }
  function handleDuplicate(event) {
    alert.confirm(
      'Duplicate event',
      `Create a copy of "${event.title}" as a draft?`,
      {
        confirmText: 'Duplicate',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await eventsRepo.create({
            ...event,
            id: undefined,
            title: `${event.title} (copy)`,
            status: 'draft',
            startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          });
          alert.success('Duplicated', 'A draft copy has been added to your events.');
        },
      },
    );
  }
  function handleCancel(event) {
    alert.confirm(
      'Cancel event?',
      `This will mark "${event.title}" as cancelled and notify ticket holders. This action cannot be undone.`,
      {
        confirmText: 'Cancel event',
        cancelText: 'Keep it',
        onConfirm: async () => {
          await eventsRepo.update(event.id, { status: 'cancelled' });
          alert.success('Event cancelled', 'Ticket holders will receive a notification.');
        },
      },
    );
  }

  const now = Date.now();
  const upcoming = all.filter((e) => e.status !== 'live' && new Date(e.startsAt).getTime() > now);
  const live = all.filter((e) => e.status === 'live');
  const past = all.filter((e) => new Date(e.endsAt).getTime() < now);
  const drafts = all.filter((e) => e.status === 'draft');

  const tabItems = useMemo(() => {
    if (tab === 'upcoming') return upcoming;
    if (tab === 'live') return live;
    if (tab === 'past') return past;
    return drafts;
  }, [tab, upcoming, live, past, drafts]);

  const items = useMemo(() => {
    const { from, to } = rangeFor(dateKey);
    const q = query.trim().toLowerCase();
    return tabItems.filter((e) => {
      const t = new Date(e.startsAt).getTime();
      if (t < from || t > to) return false;
      if (q && !`${e.title} ${e.venueName} ${e.cityName}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [tabItems, dateKey, query]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <TopBar
        title="My Events"
        onSearchPress={onOpenSearch || (() => {})}
        onCalendarPress={onOpenCalendar || (() => {})}
        onNotificationsPress={onOpenNotifications || (() => alert.info('Notifications', 'No new notifications.'))}
        onProfilePress={onOpenProfile || (() => {})}
        avatarUri={user?.avatarUrl}
        avatarName={user?.name || artist?.handle}
      />

      {/* Persistent search bar. Lives outside the scroll view so it doesn't
          get visually clipped by horizontally scrolling siblings. */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search your events…"
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          activeOpacity={0.85}
          onPress={onCreateEvent}
        >
          <Ionicons name="add" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Status tabs — Chip is now size-locked so clicking doesn't reflow. */}
      <View style={styles.tabsRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((t) => {
            const count =
              t.key === 'upcoming'
                ? upcoming.length
                : t.key === 'live'
                ? live.length
                : t.key === 'past'
                ? past.length
                : drafts.length;
            return (
              <Chip
                key={t.key}
                label={`${t.label} · ${count}`}
                active={tab === t.key}
                onPress={() => setTab(t.key)}
                style={{ marginRight: SPACING.sm }}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Date selector — horizontal selection-style pills. */}
      <View style={styles.dateRowWrap}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {DATE_FILTERS.map((d) => (
            <Chip
              key={d.key}
              label={d.label}
              active={dateKey === d.key}
              onPress={() => setDateKey(d.key)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {items.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={
              query
                ? 'No matches'
                : tab === 'drafts'
                ? 'No drafts yet'
                : 'Nothing in this tab'
            }
            message={
              query
                ? `Nothing matches "${query}" in ${tab}.`
                : tab === 'upcoming'
                ? 'Create your next event to start selling tickets.'
                : 'Events you create will show up here.'
            }
            actionLabel={tab === 'upcoming' && !query ? 'Create event' : undefined}
            onAction={onCreateEvent}
          />
        ) : (
          items.map((e) => (
            <EventManageRow
              key={e.id}
              event={e}
              onPress={() => onOpenEvent && onOpenEvent(e.id)}
              onEdit={() => handleEdit(e)}
              onReschedule={() => handleReschedule(e)}
              onDuplicate={() => handleDuplicate(e)}
              onCancel={() => handleCancel(e)}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function EventManageRow({ event, onPress, onEdit, onReschedule, onDuplicate, onCancel }) {
  const d = fmtDate(event.startsAt);
  const totalRemaining = (event.ticketTypes || []).reduce(
    (s, t) => s + (t.remaining || 0),
    0,
  );
  const lineupCount = event.lineup?.length ?? 0;
  const reelCount = event.storylineReelIds?.length ?? 0;
  const isLive = event.status === 'live';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{d.month}</Text>
        <Text style={styles.dateDay}>{d.day}</Text>
        <Text style={styles.dateWeekday}>{d.weekday}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.headRow}>
          {isLive ? (
            <Chip label="LIVE" variant="live" icon="radio" />
          ) : (
            <Chip label={(event.status || 'PUBLISHED').toUpperCase()} variant="verified" />
          )}
          <Text style={styles.time}>{d.time}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.venue} numberOfLines={1}>
          {event.venueName} · {event.cityName}
        </Text>

        <View style={styles.metaStrip}>
          <Stat icon="ticket-outline" label="Remaining" value={`${totalRemaining}`} />
          <View style={styles.metaSep} />
          <Stat icon="people-outline" label="Lineup" value={`${lineupCount}`} />
          <View style={styles.metaSep} />
          <Stat icon="film-outline" label="Reels" value={`${reelCount}`} />
        </View>

        <View style={styles.actionsRow}>
          <ActionBtn icon="brush-outline" label="Edit" primary onPress={onEdit} />
          <ActionBtn icon="time-outline" label="Reschedule" onPress={onReschedule} />
          <ActionBtn icon="copy-outline" onPress={onDuplicate} />
          <ActionBtn icon="close-circle-outline" danger onPress={onCancel} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={12} color={COLORS.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, danger, primary, onPress }) {
  const iconOnly = !label;
  const color = primary ? '#000' : danger ? COLORS.error : COLORS.textPrimary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.actionBtn,
        iconOnly && styles.actionBtnIconOnly,
        primary && styles.actionBtnPrimary,
        danger && !primary && styles.actionBtnDanger,
      ]}
    >
      <Ionicons name={icon} size={13} color={color} />
      {label ? (
        <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

EventManageRow.propTypes = {
  event: PropTypes.object,
  onPress: PropTypes.func,
  onEdit: PropTypes.func,
  onReschedule: PropTypes.func,
  onDuplicate: PropTypes.func,
  onCancel: PropTypes.func,
};
Stat.propTypes = { icon: PropTypes.string, label: PropTypes.string, value: PropTypes.string };
ActionBtn.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  danger: PropTypes.bool,
  primary: PropTypes.bool,
  onPress: PropTypes.func,
};
MyEventsScreen.propTypes = {
  onCreateEvent: PropTypes.func,
  onOpenEvent: PropTypes.func,
  onOpenSearch: PropTypes.func,
  onOpenCalendar: PropTypes.func,
  onOpenNotifications: PropTypes.func,
  onOpenProfile: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },

  tabsRowWrap: {
    // Outer wrap gives breathing room so the chips never look "cut" by the
    // edge of the scroll viewport.
    paddingVertical: SPACING.sm,
  },
  tabsRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: 2,
    alignItems: 'center',
  },

  dateRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  dateRow: {
    paddingRight: SPACING.base,
    paddingVertical: 2,
    alignItems: 'center',
  },

  list: { paddingHorizontal: SPACING.base, paddingTop: SPACING.xs },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dateBadge: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minWidth: 56,
  },
  dateMonth: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.accent },
  dateDay: { fontSize: 22, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary, marginVertical: -2 },
  dateWeekday: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted },

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  time: { fontSize: 11, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted },
  title: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary, marginTop: SPACING.xs },
  venue: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.sm,
    paddingVertical: 8,
    marginTop: SPACING.sm,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 13, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  statLabel: { fontSize: 9, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted, letterSpacing: 0.5 },
  metaSep: { width: 1, height: 24, backgroundColor: COLORS.lineSubtle },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: 'transparent',
  },
  actionBtnIconOnly: {
    width: 28,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnDanger: { borderColor: 'rgba(255,92,122,0.4)' },
  actionBtnText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, letterSpacing: 0.2 },
});
