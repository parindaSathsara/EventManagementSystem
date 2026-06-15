import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError, EmptyState } from '../../../shared/components';
import { useEventsData, useFollows } from '../../../shared/hooks';
import CompanyCard from '../components/CompanyCard';
import ProfileSheet from '../components/ProfileSheet';
import { eventsByArtistName, eventsByOrganizer } from '../utils/eventDates';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;
const VISIBLE_STATUS = new Set(['published', 'live']);

const EMPTY_SHEET = { visible: false, name: '', subtitle: '', avatarUrl: null, socials: null, relatedEvents: [] };

/**
 * The app's landing page (guest experience). One event manager shown at a time,
 * chosen via the manager tab strip on top (tap to switch). The only horizontal
 * swipe is the banner carousel inside each manager. Tapping a lineup artist or
 * the manager opens a bottom sheet (socials + events), never a full artist page.
 */
export default function EventsHomeScreen({ onOpenEvent, onOpenBooking, onOpenSearch }) {
  const events = useEventsData();
  const { isFollowing, toggle } = useFollows();
  const [feed, setFeed] = useState('forYou');
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState(EMPTY_SHEET);

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
  const current = visible[Math.min(index, Math.max(0, visible.length - 1))] || null;

  function switchFeed(next) {
    if (next === feed) return;
    setFeed(next);
    setIndex(0);
  }
  function openArtist(artist) {
    setSheet({
      visible: true,
      name: artist.name,
      subtitle: artist.role || 'Artist',
      avatarUrl: artist.avatarUrl,
      socials: artist.socials,
      relatedEvents: eventsByArtistName(events, artist.name),
    });
  }
  function openManager(org) {
    setSheet({
      visible: true,
      name: org.user?.name || org.handle || 'Event Manager',
      subtitle: org.category || 'Event Manager',
      avatarUrl: org.user?.avatarUrl,
      socials: org.socials,
      relatedEvents: eventsByOrganizer(events, org.id),
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          <Tab label="For You" active={feed === 'forYou'} onPress={() => switchFeed('forYou')} />
          <Tab label="Following" active={feed === 'following'} onPress={() => switchFeed('following')} />
        </View>
        <View style={styles.actions}>
          <IconBtn icon="search-outline" onPress={onOpenSearch} />
          <IconBtn icon="refresh-outline" onPress={events.refresh} />
        </View>
      </View>

      {/* Manager tab strip */}
      {visible.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipStripBox}
          contentContainerStyle={styles.chipStrip}
        >
          {visible.map((c, i) => {
            const nm = c.organizer.user?.name || c.organizer.handle;
            const active = i === index;
            return (
              <TouchableOpacity
                key={c.organizer.id}
                onPress={() => setIndex(i)}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{nm}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Body — the selected manager (switch via the tabs above) */}
      <View style={styles.body}>
        {events.error && managers.length === 0 ? (
          <ConnectionError error={events.error} onRetry={events.refresh} loading={events.loading} />
        ) : !current ? (
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <CompanyCard
              company={current}
              isFollowing={isFollowing(current.organizer.id)}
              onToggleFollow={() => toggle(current.organizer.id)}
              onOpenEvent={onOpenEvent}
              onOpenBooking={onOpenBooking}
              onOpenArtist={openArtist}
              onOpenManager={openManager}
            />
          </ScrollView>
        )}
      </View>

      <ProfileSheet
        {...sheet}
        onClose={() => setSheet(EMPTY_SHEET)}
        onOpenEvent={onOpenEvent}
      />
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
  onOpenBooking: PropTypes.func,
  onOpenSearch: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  header: {
    paddingTop: TOP,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgStrong,
  },
  tabs: { flexDirection: 'row', gap: SPACING.md },
  tab: { alignItems: 'center', paddingVertical: 2 },
  tabText: { fontSize: 15, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.textPrimary },
  tabUnderline: { height: 2, width: 18, borderRadius: 1, backgroundColor: COLORS.accent, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  // flexGrow:0 stops the horizontal ScrollView from expanding to fill the
  // column's vertical space (which pushed the feed half-way down the screen).
  chipStripBox: { flexGrow: 0, marginBottom: SPACING.lg },
  chipStrip: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: COLORS.surface1,
    maxWidth: 150,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 12, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textSecondary },
  chipTextActive: { color: '#000' },
  body: { flex: 1 },
});
