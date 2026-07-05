import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
import { useUnseenAlerts } from '../shared/hooks';
// Reels are disabled for now — kept on disk, just unwired from the guest app.
// import { ReelsScreen } from '../features/reels';
import { ArtistProfileScreen } from '../features/artists';
import { EventDetailScreen, EventsHomeScreen, BookingScreen } from '../features/events';
import { UpcomingEventsScreen } from '../features/calendar';
import { SearchScreen } from '../features/search';
import { NotificationsScreen } from '../features/notifications';

/**
 * Guest navigation — the app's default experience. No login required.
 *
 * Bottom tabs: Events · Calendar · Alerts. Lands on **Events**. Reels are
 * commented out for now. Event managers no longer use a discreet header key —
 * they register via the CTA on the Alerts tab, which calls `onManagerLogin`
 * (owned by App.js).
 */
const TABS = [
  // { key: 'reels', label: 'Reels', icon: 'play-outline', iconActive: 'play' },
  // "Events" was renamed to "Timeline" (with a new icon) per client feedback.
  { key: 'events', label: 'Timeline', icon: 'albums-outline', iconActive: 'albums' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications' },
];

export default function GuestTabs({ onManagerLogin }) {
  const [tab, setTab] = useState('events'); // land on Timeline
  const [stack, setStack] = useState({ name: null, params: {} });
  const { count: unseenAlerts, markSeen } = useUnseenAlerts();

  const push = useCallback((name, params = {}) => setStack({ name, params }), []);
  const pop = useCallback(() => setStack({ name: null, params: {} }), []);

  // Opening the Alerts tab clears the unseen badge — no leftover dot.
  useEffect(() => {
    if (tab === 'notifications') markSeen();
  }, [tab, markSeen]);

  const tabs = TABS.map((t) =>
    t.key === 'notifications' && unseenAlerts > 0 && tab !== 'notifications'
      ? { ...t, badge: unseenAlerts }
      : t,
  );

  if (stack.name === 'event') {
    return (
      <EventDetailScreen
        eventId={stack.params.eventId}
        onBack={pop}
        onOpenEvent={(id) => push('event', { eventId: id })}
        onBook={(eventId) => push('booking', { eventId })}
      />
    );
  }

  if (stack.name === 'booking') {
    return (
      <BookingScreen
        eventId={stack.params.eventId}
        ticketTypeId={stack.params.ticketTypeId}
        onBack={pop}
        onDone={() => pop()}
      />
    );
  }

  if (stack.name === 'artist') {
    return (
      <ArtistProfileScreen
        artistId={stack.params.artistId}
        onBack={pop}
        // Reels disabled — opening a reel just returns to the previous screen.
        onReelPress={pop}
      />
    );
  }

  if (stack.name === 'search') {
    return (
      <SearchScreen
        onOpenEvent={(id) => push('event', { eventId: id })}
        onOpenArtist={(id) => push('artist', { artistId: id })}
        onBack={pop}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {/* Reels tab disabled for now.
        {tab === 'reels' ? (
          <ReelsScreen
            initialIndex={0}
            onNavigateToArtist={(id) => push('artist', { artistId: id })}
            onNavigateToEvent={(id) => push('event', { eventId: id })}
          />
        ) : null}
        */}

        {tab === 'events' ? (
          <EventsHomeScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenBooking={(eventId) => push('booking', { eventId })}
            onOpenSearch={() => push('search')}
          />
        ) : null}

        {tab === 'calendar' ? (
          <UpcomingEventsScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenSearch={() => push('search')}
            onManagerLogin={onManagerLogin}
          />
        ) : null}

        {tab === 'notifications' ? (
          <NotificationsScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
          />
        ) : null}
      </View>

      <BottomTabBar tabs={tabs} activeKey={tab} onChange={setTab} />
    </View>
  );
}

GuestTabs.propTypes = {
  onManagerLogin: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  body: { flex: 1 },
});
