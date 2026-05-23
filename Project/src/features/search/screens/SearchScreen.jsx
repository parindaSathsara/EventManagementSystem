import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Chip, EventCard, ScreenHeader, EmptyState, Avatar } from '../../../shared/components';
import { useEventsData, useReelsData, useAlert } from '../../../shared/hooks';
import { reelsRepo } from '../../../services';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'artists', label: 'Artists' },
  { key: 'venues', label: 'Venues' },
];

const RECENT = ['Mihiran', 'Stardust Arena', 'Hip Hop', 'Festival', 'Open Decks'];

function deriveArtists(reels) {
  const map = new Map();
  reels.forEach((r) => {
    if (!map.has(r.artist.id)) map.set(r.artist.id, r.artist);
  });
  return Array.from(map.values());
}

function deriveVenues(events) {
  const map = new Map();
  events.forEach((e) => {
    if (!map.has(e.venueName)) {
      map.set(e.venueName, {
        name: e.venueName,
        city: e.cityName,
        eventCount: 1,
      });
    } else {
      map.get(e.venueName).eventCount += 1;
    }
  });
  return Array.from(map.values());
}

export default function SearchScreen({ onOpenEvent, onOpenArtist }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  const allEvents = useEventsData();
  const allReels = useReelsData();
  const alert = useAlert();

  const artists = useMemo(() => deriveArtists(allReels), [allReels]);
  const venues = useMemo(() => deriveVenues(allEvents), [allEvents]);

  const q = query.trim().toLowerCase();

  const filteredEvents = useMemo(
    () =>
      q
        ? allEvents.filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              e.venueName.toLowerCase().includes(q) ||
              e.cityName.toLowerCase().includes(q) ||
              (e.category || '').toLowerCase().includes(q),
          )
        : allEvents.slice(0, 5),
    [q, allEvents],
  );
  const filteredArtists = useMemo(
    () => (q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : artists),
    [q, artists],
  );
  const filteredVenues = useMemo(
    () =>
      q
        ? venues.filter(
            (v) =>
              v.name.toLowerCase().includes(q) ||
              v.city.toLowerCase().includes(q),
          )
        : venues,
    [q, venues],
  );

  const showEvents = tab === 'all' || tab === 'events';
  const showArtists = tab === 'all' || tab === 'artists';
  const showVenues = tab === 'all' || tab === 'venues';

  const noResults =
    q &&
    filteredEvents.length === 0 &&
    filteredArtists.length === 0 &&
    filteredVenues.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScreenHeader title="Search" />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholder="Artists, events, venues, cities…"
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            active={tab === t.key}
            onPress={() => setTab(t.key)}
            style={{ marginRight: SPACING.sm }}
          />
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {!q ? (
          <View style={styles.recentWrap}>
            <Text style={styles.sectionLabel}>Recent</Text>
            <View style={styles.recentRow}>
              {RECENT.map((r) => (
                <Chip key={r} label={r} onPress={() => setQuery(r)} icon="time-outline" />
              ))}
            </View>
          </View>
        ) : null}

        {noResults ? (
          <EmptyState
            icon="search-outline"
            title="No results"
            message={`Nothing matched "${query}". Try a different keyword.`}
          />
        ) : null}

        {showArtists && filteredArtists.length > 0 ? (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={styles.sectionLabel}>Artists</Text>
            {filteredArtists.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => onOpenArtist && onOpenArtist(a.id)}
              >
                <Avatar uri={a.avatarUrl} name={a.name} size={44} verified />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{a.name}</Text>
                  <Text style={styles.rowSub}>{a.handle}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.followPill, a.isFollowing && styles.followPillActive]}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    reelsRepo.toggleFollow(a.id);
                  }}
                >
                  <Text style={[styles.followPillText, a.isFollowing && styles.followPillTextActive]}>
                    {a.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {showEvents && filteredEvents.length > 0 ? (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={styles.sectionLabel}>Events</Text>
            <View style={{ paddingHorizontal: SPACING.base }}>
              {filteredEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  variant="compact"
                  onPress={() => onOpenEvent && onOpenEvent(e.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showVenues && filteredVenues.length > 0 ? (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={styles.sectionLabel}>Venues</Text>
            {filteredVenues.map((v) => (
              <TouchableOpacity
                key={v.name}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => {
                  setQuery(v.name);
                  setTab('events');
                }}
              >
                <View style={styles.venueIcon}>
                  <Ionicons name="business" size={18} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{v.name}</Text>
                  <Text style={styles.rowSub}>
                    {v.city} · {v.eventCount} upcoming
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

SearchScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenArtist: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  tabs: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  body: { paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  recentWrap: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  rowTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  rowSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  followPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  followPillActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  followPillText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: '#000',
  },
  followPillTextActive: {
    color: COLORS.textSecondary,
  },
  venueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
