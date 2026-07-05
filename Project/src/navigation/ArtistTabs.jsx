import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
import {
  ArtistHomeScreen,
  VerificationScreen,
  ArtistMyProfileScreen,
  EventCreatorScreen,
  MyEventsScreen,
  EditArtistProfileScreen,
} from '../features/artistApp';
// Reels + Insights disabled for now — kept on disk, unwired.
// import { ReelEditorScreen } from '../features/reelEditor';
import { EventDetailScreen } from '../features/events';
import { useAlert, useUser } from '../shared/hooks';
import { eventsRepo } from '../services';

// Trimmed per client feedback: Insights tab and the centre "+" (it duplicated
// the + button on My Events) are gone. Home · Events · Profile.
const TABS = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'events', label: 'Events', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function ArtistTabs({ onSwitchToCustomer, onLogout, onNeedArtistProfile }) {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState({ name: null, params: {} });
  const alert = useAlert();
  const { artist } = useUser();

  const push = useCallback((name, params = {}) => setStack({ name, params }), []);
  const pop = useCallback(() => setStack({ name: null, params: {} }), []);

  /**
   * Gate publishing flows. Both reel + event creation require an artist
   * profile; if the caller doesn't have one yet, route them through
   * BecomeArtistScreen (owned by App.js) instead of crashing in the editor.
   */
  const pushPublishing = useCallback(
    (name) => {
      if (!artist) {
        if (onNeedArtistProfile) onNeedArtistProfile();
        else alert.info('Set up your artist profile', 'Create an artist profile to publish.');
        return;
      }
      push(name);
    },
    [artist, onNeedArtistProfile, push, alert],
  );

  // Reels disabled for now.
  // if (stack.name === 'reelEditor') {
  //   return <ReelEditorScreen onBack={pop} onPublish={() => pop()} />;
  // }
  if (stack.name === 'eventCreator') {
    // `eventId` present → edit mode (surprise artists, price changes, etc.).
    const editing = stack.params.eventId ? eventsRepo.getById(stack.params.eventId) : null;
    return <EventCreatorScreen event={editing} onBack={pop} onSubmit={() => pop()} />;
  }
  if (stack.name === 'verification') {
    return <VerificationScreen onBack={pop} />;
  }
  if (stack.name === 'editProfile') {
    return <EditArtistProfileScreen onBack={pop} />;
  }
  if (stack.name === 'event') {
    return <EventDetailScreen eventId={stack.params.eventId} onBack={pop} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {tab === 'home' ? (
          <ArtistHomeScreen
            onCreateEvent={() => pushPublishing('eventCreator')}
            onOpenEvent={(id) => push('event', { eventId: id })}
            onEditEvent={(id) => push('eventCreator', { eventId: id })}
            onOpenVerification={() => push('verification')}
            onOpenMyEvents={() => setTab('events')}
            onOpenProfile={() => setTab('profile')}
            onSwitchToCustomer={onSwitchToCustomer}
          />
        ) : null}

        {tab === 'events' ? (
          <MyEventsScreen
            onCreateEvent={() => pushPublishing('eventCreator')}
            onOpenEvent={(id) => push('event', { eventId: id })}
            onEditEvent={(id) => push('eventCreator', { eventId: id })}
            onOpenSearch={() =>
              alert.info('Search', 'Type in the search bar below the header to filter your events.')
            }
            onOpenCalendar={() =>
              alert.info('Calendar view', 'Calendar view of your events ships in the next sprint.')
            }
            onOpenNotifications={() =>
              alert.info('Notifications', 'You\'re all caught up.')
            }
            onOpenProfile={() => setTab('profile')}
          />
        ) : null}

        {tab === 'profile' ? (
          <ArtistMyProfileScreen
            onSwitchToCustomer={onSwitchToCustomer}
            onOpenVerification={() => push('verification')}
            onCreateEvent={() => pushPublishing('eventCreator')}
            onEditProfile={() => push('editProfile')}
            onLogout={onLogout}
          />
        ) : null}
      </View>

      <BottomTabBar tabs={TABS} activeKey={tab} onChange={setTab} />
    </View>
  );
}

ArtistTabs.propTypes = {
  onSwitchToCustomer: PropTypes.func,
  onLogout: PropTypes.func,
  onNeedArtistProfile: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  body: { flex: 1 },
});
