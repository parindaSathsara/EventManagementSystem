import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
import { ReelsScreen } from '../features/reels';
import { ArtistProfileScreen } from '../features/artists';
import { CalendarScreen } from '../features/calendar';
import { EventDetailScreen, EventsHomeScreen, BookingScreen } from '../features/events';
import { SearchScreen } from '../features/search';
import { NotificationsScreen } from '../features/notifications';

/**
 * Guest navigation — the app's default experience. No login required.
 *
 * Bottom tabs: Reels · Events · Notifications. Lands on **Events** (Reels is
 * now just a tab, no longer the entry point). Event managers reach their own
 * app (ArtistTabs) via the discreet "manager login" entry in the Events
 * header, which calls `onManagerLogin` (owned by App.js).
 */
const TABS = [
  { key: 'reels', label: 'Reels', icon: 'play-outline', iconActive: 'play' },
  { key: 'events', label: 'Events', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications' },
];

export default function GuestTabs({ onManagerLogin }) {
  const [tab, setTab] = useState('events'); // land on Events
  const [stack, setStack] = useState({ name: null, params: {} });
  const [initialReelIndex, setInitialReelIndex] = useState(0);

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
        onReelPress={() => {
          setInitialReelIndex(0);
          setTab('reels');
          pop();
        }}
      />
    );
  }

  if (stack.name === 'calendar') {
    return (
      <CalendarScreen
        onOpenEvent={(id) => push('event', { eventId: id })}
        onOpenSearch={() => push('search')}
        onBack={pop}
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
        {tab === 'reels' ? (
          <ReelsScreen
            initialIndex={initialReelIndex}
            onNavigateToArtist={(id) => push('artist', { artistId: id })}
            onNavigateToEvent={(id) => push('event', { eventId: id })}
          />
        ) : null}

        {tab === 'events' ? (
          <EventsHomeScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenArtist={(id) => push('artist', { artistId: id })}
            onOpenBooking={(eventId) => push('booking', { eventId })}
            onOpenSearch={() => push('search')}
            onOpenCalendar={() => push('calendar')}
            onManagerLogin={onManagerLogin}
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
