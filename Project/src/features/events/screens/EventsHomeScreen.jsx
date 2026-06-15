import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError, EmptyState } from '../../../shared/components';
import { useEventsData, useFollows } from '../../../shared/hooks';
import EventStepCard from '../components/EventStepCard';
import ProfileSheet from '../components/ProfileSheet';
import { eventsByArtistName, eventsByOrganizer } from '../utils/eventDates';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;
// The BottomTabBar is an absolute overlay — reserve its height so each event
// page (incl. the Book button) sits fully above it and the feed scrolls.
const TAB_BAR_H = Platform.OS === 'ios' ? 90 : 70;
const VISIBLE_STATUS = new Set(['published', 'live']);
const EMPTY_SHEET = { visible: false, name: '', subtitle: '', avatarUrl: null, socials: null, relatedEvents: [] };

/**
 * The app's landing page (guest experience). Events listed **event-wise** as a
 * vertical stepper feed — one event per screen, scroll/snap down to step to the
 * next event. The event name is the focus and the event owner (manager) is shown.
 * Tapping a lineup artist or the owner opens a bottom sheet (socials + events).
 */
export default function EventsHomeScreen({ onOpenEvent, onOpenBooking, onOpenSearch }) {
  const events = useEventsData();
  const { isFollowing, toggle } = useFollows();
  const [feed, setFeed] = useState('forYou');
  const [bodyH, setBodyH] = useState(0);
  const [sheet, setSheet] = useState(EMPTY_SHEET);

  const all = useMemo(
    () =>
      events
        .filter((e) => e?.organizer?.id && (!e.status || VISIBLE_STATUS.has(e.status)))
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [events],
  );
  const visible = useMemo(
    () => (feed === 'following' ? all.filter((e) => isFollowing(e.organizer.id)) : all),
    [all, feed, isFollowing],
  );

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
          <Tab label="For You" active={feed === 'forYou'} onPress={() => setFeed('forYou')} />
          <Tab label="Following" active={feed === 'following'} onPress={() => setFeed('following')} />
        </View>
        <View style={styles.actions}>
          <IconBtn icon="search-outline" onPress={onOpenSearch} />
          <IconBtn icon="refresh-outline" onPress={events.refresh} />
        </View>
      </View>

      {/* Event-wise vertical stepper feed */}
      <View style={styles.body} onLayout={(e) => setBodyH(e.nativeEvent.layout.height)}>
        {events.error && all.length === 0 ? (
          <ConnectionError error={events.error} onRetry={events.refresh} loading={events.loading} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={feed === 'following' ? 'heart-outline' : 'flame-outline'}
            title={feed === 'following' ? 'Nothing followed yet' : 'No events yet'}
            message={
              feed === 'following'
                ? 'Follow an event owner to see their events here.'
                : 'Check back soon — new events are added all the time.'
            }
          />
        ) : bodyH > 0 ? (
          <FlatList
            data={visible}
            keyExtractor={(e) => e.id}
            snapToInterval={bodyH}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_d, i) => ({ length: bodyH, offset: bodyH * i, index: i })}
            renderItem={({ item }) => (
              <EventStepCard
                event={item}
                height={bodyH}
                isFollowing={isFollowing(item.organizer.id)}
                onToggleFollow={() => toggle(item.organizer.id)}
                onOpenEvent={onOpenEvent}
                onOpenBooking={onOpenBooking}
                onOpenArtist={openArtist}
                onOpenManager={openManager}
              />
            )}
          />
        ) : null}
      </View>

      <ProfileSheet {...sheet} onClose={() => setSheet(EMPTY_SHEET)} onOpenEvent={onOpenEvent} />
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
  body: { flex: 1, marginBottom: TAB_BAR_H },
});
