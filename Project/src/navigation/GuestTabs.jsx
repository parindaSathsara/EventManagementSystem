import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
// Reels are disabled for now — kept on disk, just unwired from the guest app.
// import { ReelsScreen } from '../features/reels';
import { ArtistProfileScreen } from '../features/artists';
import { EventDetailScreen, EventsHomeScreen, BookingScreen } from '../features/events';
import { CalendarScreen } from '../features/calendar';
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
  { key: 'events', label: 'Events', icon: 'flame-outline', iconActive: 'flame' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications' },
];

export default function GuestTabs({ onManagerLogin }) {
  const [tab, setTab] = useState('events'); // land on Events
  const [stack, setStack] = useState({ name: null, params: {} });

  const push = useCallback((name, params = {}) => setStack({ name, params }), []);
  const pop = useCallback(() => setStack({ name: null, params: {} }), []);

  if (stack.name === 'event') {
    return (
      <EventDetailScreen
        eventId={stack.params.eventId}
        onBack={pop}
        onArtistPress={(artistId) => push('artist', { artistId })}
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
            onOpenArtist={(id) => push('artist', { artistId: id })}
            onOpenBooking={(eventId) => push('booking', { eventId })}
            onOpenSearch={() => push('search')}
          />
        ) : null}

        {tab === 'calendar' ? (
          <CalendarScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenSearch={() => push('search')}
          />
        ) : null}

        {tab === 'notifications' ? (
          <NotificationsScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onManagerLogin={onManagerLogin}
          />
        ) : null}
      </View>

      <BottomTabBar tabs={TABS} activeKey={tab} onChange={setTab} />
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
