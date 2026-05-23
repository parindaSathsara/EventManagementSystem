import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS } from '../theme';
import { BottomTabBar } from '../shared/components';
import {
  ArtistHomeScreen,
  InsightsScreen,
  VerificationScreen,
  ArtistMyProfileScreen,
  CreateHubScreen,
  EventCreatorScreen,
  MyEventsScreen,
  EditArtistProfileScreen,
} from '../features/artistApp';
import { ReelEditorScreen } from '../features/reelEditor';
import { EventDetailScreen } from '../features/events';
import { useAlert, useUser } from '../shared/hooks';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'events', label: 'Events', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'create', icon: 'add', center: true },
  { key: 'insights', label: 'Insights', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
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

  if (stack.name === 'reelEditor') {
    return <ReelEditorScreen onBack={pop} onPublish={() => pop()} />;
  }
  if (stack.name === 'eventCreator') {
    return <EventCreatorScreen onBack={pop} onSubmit={() => pop()} />;
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

  function handleTabChange(key) {
    if (key === 'create') {
      setTab('create');
      return;
    }
    setTab(key);
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {tab === 'home' ? (
          <ArtistHomeScreen
            onCreateReel={() => pushPublishing('reelEditor')}
            onCreateEvent={() => pushPublishing('eventCreator')}
            onOpenEvent={(id) => push('event', { eventId: id })}
            onOpenVerification={() => push('verification')}
            onOpenInsights={() => setTab('insights')}
            onOpenReelEditor={() => pushPublishing('reelEditor')}
            onOpenProfile={() => setTab('profile')}
            onSwitchToCustomer={onSwitchToCustomer}
          />
        ) : null}

        {tab === 'events' ? (
          <MyEventsScreen
            onCreateEvent={() => pushPublishing('eventCreator')}
            onOpenEvent={(id) => push('event', { eventId: id })}
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

        {tab === 'create' ? (
          <CreateHubScreen
            onCreateReel={() => pushPublishing('reelEditor')}
            onCreateEvent={() => pushPublishing('eventCreator')}
            onOpenDrafts={() =>
              alert.info(
                'Drafts',
                'Saved drafts are stored locally. Full drafts manager ships in the next sprint.',
              )
            }
            onBack={() => setTab('home')}
          />
        ) : null}

        {tab === 'insights' ? <InsightsScreen /> : null}

        {tab === 'profile' ? (
          <ArtistMyProfileScreen
            onSwitchToCustomer={onSwitchToCustomer}
            onOpenVerification={() => push('verification')}
            onCreateEvent={() => pushPublishing('eventCreator')}
            onCreateReel={() => pushPublishing('reelEditor')}
            onEditProfile={() => push('editProfile')}
            onLogout={onLogout}
          />
        ) : null}
      </View>

      <BottomTabBar tabs={TABS} activeKey={tab} onChange={handleTabChange} />
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
