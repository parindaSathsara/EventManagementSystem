import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
import { ReelsScreen } from '../features/reels';
import { ArtistProfileScreen } from '../features/artists';
import { reelsRepo } from '../services';
import { CalendarScreen } from '../features/calendar';
import { EventDetailScreen } from '../features/events';
import { SearchScreen } from '../features/search';
import { TicketsScreen, TicketDetailScreen } from '../features/tickets';
import { CustomerProfileScreen } from '../features/profile';

const TABS = [
  { key: 'feed', label: 'Feed', icon: 'play-outline', iconActive: 'play' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'search', label: 'Search', icon: 'search-outline', iconActive: 'search' },
  { key: 'tickets', label: 'Tickets', icon: 'ticket-outline', iconActive: 'ticket' },
  { key: 'profile', label: 'You', icon: 'person-outline', iconActive: 'person' },
];

export default function CustomerTabs({ onSwitchToArtist, onLogout }) {
  const [tab, setTab] = useState('calendar'); // open on Calendar (the hero) for the demo
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
      />
    );
  }

  if (stack.name === 'artist') {
    return (
      <ArtistProfileScreen
        artistId={stack.params.artistId}
        onBack={pop}
        onReelPress={(reel) => {
          const idx = reelsRepo.getAll().findIndex((r) => r.id === reel.id);
          setInitialReelIndex(idx >= 0 ? idx : 0);
          setTab('feed');
          pop();
        }}
      />
    );
  }

  if (stack.name === 'ticket') {
    return (
      <TicketDetailScreen
        ticketId={stack.params.ticketId}
        onBack={pop}
        onOpenEvent={(id) => push('event', { eventId: id })}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {tab === 'feed' ? (
          <ReelsScreen
            initialIndex={initialReelIndex}
            onNavigateToArtist={(id) => push('artist', { artistId: id })}
            onNavigateToEvent={(id) => push('event', { eventId: id })}
          />
        ) : null}

        {tab === 'calendar' ? (
          <CalendarScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenSearch={() => setTab('search')}
          />
        ) : null}

        {tab === 'search' ? (
          <SearchScreen
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenArtist={(id) => push('artist', { artistId: id })}
          />
        ) : null}

        {tab === 'tickets' ? (
          <TicketsScreen onOpenTicket={(id) => push('ticket', { ticketId: id })} />
        ) : null}

        {tab === 'profile' ? (
          <CustomerProfileScreen
            onSwitchToArtist={onSwitchToArtist}
            onOpenEvent={(id) => push('event', { eventId: id })}
            onLogout={onLogout}
          />
        ) : null}
      </View>

      <BottomTabBar tabs={TABS} activeKey={tab} onChange={setTab} />
    </View>
  );
}

CustomerTabs.propTypes = {
  onSwitchToArtist: PropTypes.func,
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  body: { flex: 1 },
});
