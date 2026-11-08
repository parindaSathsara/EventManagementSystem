import React, { useEffect, useMemo, useRef, useState } from 'react';
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
 * Last event index the guest stepped to, per feed. Module-level on purpose:
 * it outlives a remount of this screen, so coming back from the manager area
 * (or any full remount) reopens the feed where the guest left off instead of
 * at the first post. Tab switches are handled by GuestTabs keeping the screen
 * mounted — this is the belt to that pair of braces.
 */
const lastIndexByFeed = { forYou: 0, following: 0 };

/**
 * The app's landing page (guest experience). Events listed **event-wise** as a
 * vertical stepper feed — one event per screen, scroll/snap down to step to the
 * next event. The event name is the focus and the event owner (manager) is shown.
 * Tapping a lineup artist or the owner opens a bottom sheet (socials + events).
 */
export default function EventsHomeScreen({ onOpenEvent, onOpenSearch, onManagerCreate, active = true }) {
  const events = useEventsData();
  const { isFollowing, toggle } = useFollows();
  const [feed, setFeed] = useState('forYou');
  const [activeIndex, setActiveIndex] = useState(lastIndexByFeed.forYou);
  const [bodyH, setBodyH] = useState(0);
  const [sheet, setSheet] = useState(EMPTY_SHEET);
  const listRef = useRef(null);
  const wasActive = useRef(active);

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

  useEffect(() => {
    setActiveIndex(Math.min(lastIndexByFeed[feed] || 0, Math.max(visible.length - 1, 0)));
  }, [feed, visible.length]);

  /**
   * Coming back to this tab, re-assert the remembered position. Keeping the
   * screen mounted is what normally preserves it, but a hidden tab is laid
   * out at zero height and some Android builds clamp the native scroll offset
   * when that happens — so we put the guest back on their event explicitly
   * rather than trusting the platform. Scrolling to where we already are is a
   * no-op, so this is safe either way.
   */
  useEffect(() => {
    const becameActive = active && !wasActive.current;
    wasActive.current = active;
    if (!becameActive || bodyH <= 0 || visible.length === 0) return undefined;
    const index = Math.min(lastIndexByFeed[feed] || 0, visible.length - 1);
    setActiveIndex(index);
    if (index <= 0) return undefined;
    // Next frame: the tab has just been shown, so let it lay out first.
    const raf = requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToIndex({ index, animated: false });
      } catch {
        /* list not measured yet — the stored offset already holds */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [active, bodyH, feed, visible.length]);

  function openArtist(artist, fromEvent) {
    // "Revealed Soon" is a surprise slot, not a real artist — no social links
    // exist yet, so show the coming-soon note + the company's upcoming events.
    if ((artist?.name || '').trim().toLowerCase() === 'revealed soon') {
      const orgId = fromEvent?.organizer?.id;
      const upcoming = eventsByOrganizer(events, orgId).filter(
        (e) => new Date(e.startsAt).getTime() > Date.now(),
      );
      setSheet({
        visible: true,
        name: 'Revealed Soon',
        subtitle: 'Surprise act',
        avatarUrl: null,
        socials: null,
        note: 'More artists are coming soon from the event companies below.',
        relatedEvents: upcoming,
      });
      return;
    }
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

      {/* Header — ONE row (client feedback 2026-11-08): the feed tabs sit up
          top-left, so the space the second row used goes to the flyer.
          (The old striped wordmark here was not the client's logo.) */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          <Tab label="For You" active={feed === 'forYou'} onPress={() => setFeed('forYou')} />
          <Tab label="Following" active={feed === 'following'} onPress={() => setFeed('following')} />
        </View>
        <View style={styles.actions}>
          <View
            style={styles.feedPosition}
            accessibilityLabel={`Event ${Math.min(activeIndex + 1, visible.length)} of ${visible.length}`}
          >
            <Text style={styles.feedPositionCurrent}>
              {String(visible.length ? activeIndex + 1 : 0).padStart(2, '0')}
            </Text>
            <Text style={styles.feedPositionTotal}>/{String(visible.length).padStart(2, '0')}</Text>
          </View>
          <IconBtn icon="search-outline" onPress={onOpenSearch} />
          {/* "+" between search & refresh — event companies / managers create
              an event from here (routes through the manager login). */}
          <IconBtn icon="add-circle-outline" onPress={onManagerCreate} />
          <IconBtn icon="refresh-outline" onPress={events.refresh} />
        </View>
      </View>

      {/* Event-wise vertical stepper feed */}
      <View
        style={styles.body}
        // Ignore 0-height layouts: while this tab is hidden the body measures
        // 0, and dropping the height would tear down the list (and its scroll
        // position) every time the guest visits another tab.
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) setBodyH(h);
        }}
      >
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
            // Remount per feed so each one restores its own last position.
            key={feed}
            ref={listRef}
            data={visible}
            keyExtractor={(e) => e.id}
            snapToInterval={bodyH}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_d, i) => ({ length: bodyH, offset: bodyH * i, index: i })}
            initialScrollIndex={Math.min(lastIndexByFeed[feed] || 0, Math.max(visible.length - 1, 0))}
            onMomentumScrollEnd={(e) => {
              const index = Math.max(0, Math.round(e.nativeEvent.contentOffset.y / bodyH));
              lastIndexByFeed[feed] = index;
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <EventStepCard
                event={item}
                height={bodyH}
                isFollowing={isFollowing(item.organizer.id)}
                onToggleFollow={() => toggle(item.organizer.id)}
                onOpenEvent={onOpenEvent}
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
  onOpenSearch: PropTypes.func,
  onManagerCreate: PropTypes.func,
  // False while another tab is showing — the screen stays mounted either way.
  active: PropTypes.bool,
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
  feedPosition: { flexDirection: 'row', alignItems: 'baseline', marginRight: SPACING.xs },
  feedPositionCurrent: { fontSize: 13, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  feedPositionTotal: { fontSize: 10, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginBottom: TAB_BAR_H },
});
