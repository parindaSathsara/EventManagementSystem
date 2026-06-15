import React, { useMemo, useState } from 'react';
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
import { COLORS, SPACING } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError, EmptyState } from '../../../shared/components';
import { useEventsData, useFollows } from '../../../shared/hooks';
import CompanyCard from '../components/CompanyCard';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;
const VISIBLE_STATUS = new Set(['published', 'live']);

/**
 * The app's landing page (guest experience). A vertical feed of **event
 * managers** — scroll down to move from one manager to the next. Each manager
 * card shows a swipeable banner carousel, all of their events, the line up, and
 * socials.
 *
 *   Header:  [ For You | Following ]            🔍  ↻
 *   Body:    CompanyCard per organizer (event manager)
 */
export default function EventsHomeScreen({
  onOpenEvent,
  onOpenArtist,
  onOpenBooking,
  onOpenSearch,
}) {
  const events = useEventsData();
  const { isFollowing, toggle } = useFollows();
  const [feed, setFeed] = useState('forYou'); // 'forYou' | 'following'

  // Group events by organizer → managers, each sorted by soonest event.
  const managers = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const org = e.organizer;
      if (!org?.id) continue;
      if (e.status && !VISIBLE_STATUS.has(e.status)) continue;
      if (!map.has(org.id)) map.set(org.id, { organizer: org, events: [] });
      map.get(org.id).events.push(e);
    }
    const list = [...map.values()];
    list.forEach((c) => c.events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
    list.sort((a, b) => new Date(a.events[0]?.startsAt) - new Date(b.events[0]?.startsAt));
    return list;
  }, [events]);

  const visible = useMemo(
    () => (feed === 'following' ? managers.filter((c) => isFollowing(c.organizer.id)) : managers),
    [managers, feed, isFollowing],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          <Tab label="For You" active={feed === 'forYou'} onPress={() => setFeed('forYou')} />
          <Tab label="Following" active={feed === 'following'} onPress={() => setFeed('following')} />
        </View>
        <View style={styles.actions}>
          <IconBtn icon="search-outline" onPress={onOpenSearch} />
          <IconBtn icon="refresh-outline" onPress={events.refresh} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={events.refresh} tintColor={COLORS.accent} />
        }
      >
        {events.error && managers.length === 0 ? (
          <ConnectionError error={events.error} onRetry={events.refresh} loading={events.loading} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={feed === 'following' ? 'heart-outline' : 'flame-outline'}
            title={feed === 'following' ? 'No managers followed yet' : 'No events yet'}
            message={
              feed === 'following'
                ? 'Tap Follow on an event manager to see them here.'
                : 'Check back soon — new events are added all the time.'
            }
          />
        ) : (
          visible.map((c) => (
            <CompanyCard
              key={c.organizer.id}
              company={c}
              isFollowing={isFollowing(c.organizer.id)}
              onToggleFollow={() => toggle(c.organizer.id)}
              onOpenEvent={onOpenEvent}
              onOpenBooking={onOpenBooking}
              onOpenArtist={onOpenArtist}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tab}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </TouchableOpacity>
  );
}

function IconBtn({ icon, onPress }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );
}

Tab.propTypes = { label: PropTypes.string, active: PropTypes.bool, onPress: PropTypes.func };
IconBtn.propTypes = { icon: PropTypes.string, onPress: PropTypes.func };

EventsHomeScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenArtist: PropTypes.func,
  onOpenBooking: PropTypes.func,
  onOpenSearch: PropTypes.func,
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
    backgroundColor: COLORS.bgStrong,
  },
  tabs: { flexDirection: 'row', gap: SPACING.lg },
  tab: { alignItems: 'center', paddingVertical: 4 },
  tabText: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textMuted,
  },
  tabTextActive: { color: COLORS.textPrimary },
  tabUnderline: {
    height: 3,
    width: 22,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: SPACING.xxl },
});
