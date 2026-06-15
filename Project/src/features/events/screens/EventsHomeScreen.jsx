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

/**
 * The app's landing page (guest experience). A company-centric feed:
 *
 *   Header:  [ For You | Following ]            🔍  📅  (🔑 manager login)
 *   Body:    CompanyCard per organizer
 *
 * Events are grouped by their organizer (the "event company"). "Following"
 * filters to the device-local follow set (guests have no account).
 */
export default function EventsHomeScreen({
  onOpenEvent,
  onOpenArtist,
  onOpenBooking,
  onOpenSearch,
  onOpenCalendar,
  onManagerLogin,
}) {
  const events = useEventsData();
  const { isFollowing, toggle } = useFollows();
  const [feed, setFeed] = useState('forYou'); // 'forYou' | 'following'

  // Group events by organizer → companies, sorted by soonest upcoming event.
  const companies = useMemo(() => {
    const map = new Map();
    const VISIBLE = new Set(['published', 'live']);
    for (const e of events) {
      const org = e.organizer;
      if (!org?.id) continue;
      // Only surface publicly-visible events; drafts/cancelled stay hidden.
      if (e.status && !VISIBLE.has(e.status)) continue;
      if (!map.has(org.id)) map.set(org.id, { organizer: org, events: [] });
      map.get(org.id).events.push(e);
    }
    const list = [...map.values()];
    list.forEach((c) =>
      c.events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    );
    list.sort((a, b) => new Date(a.events[0]?.startsAt) - new Date(b.events[0]?.startsAt));
    return list;
  }, [events]);

  const visible = useMemo(() => {
    if (feed === 'following') return companies.filter((c) => isFollowing(c.organizer.id));
    return companies;
  }, [companies, feed, isFollowing]);

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
          <IconBtn icon="calendar-outline" onPress={onOpenCalendar} />
          <IconBtn icon="key-outline" onPress={onManagerLogin} subtle />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={events.refresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {events.error && companies.length === 0 ? (
          <ConnectionError error={events.error} onRetry={events.refresh} loading={events.loading} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={feed === 'following' ? 'heart-outline' : 'calendar-outline'}
            title={feed === 'following' ? 'No companies followed yet' : 'No events yet'}
            message={
              feed === 'following'
                ? 'Tap Follow on a company to see them here.'
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

function IconBtn({ icon, onPress, subtle }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={subtle ? COLORS.textMuted : COLORS.textPrimary} />
    </TouchableOpacity>
  );
}

Tab.propTypes = { label: PropTypes.string, active: PropTypes.bool, onPress: PropTypes.func };
IconBtn.propTypes = { icon: PropTypes.string, onPress: PropTypes.func, subtle: PropTypes.bool };

EventsHomeScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenArtist: PropTypes.func,
  onOpenBooking: PropTypes.func,
  onOpenSearch: PropTypes.func,
  onOpenCalendar: PropTypes.func,
  onManagerLogin: PropTypes.func,
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
  tabs: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  tabUnderline: {
    height: 3,
    width: 22,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: SPACING.xxl,
  },
});
