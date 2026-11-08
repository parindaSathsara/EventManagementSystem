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
import { useEventsData, useReelsData, useFollows } from '../../../shared/hooks';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'artists', label: 'Artists' },
];

const RECENT = ['Mihiran', 'Hip Hop', 'Festival', 'Colombo', 'Ella'];

/**
 * Search results are Artists (event companies + reel artists) and Events —
 * venues/news removed per client feedback. Results filter live as you type
 * ("L" already narrows the list), and events match on title, venue, city,
 * category, company name and lineup artist names.
 */
function deriveArtists(reels, events) {
  const map = new Map();
  // Event companies (organizers) are artist records — searchable + openable.
  events.forEach((e) => {
    const org = e.organizer;
    if (org?.id && !map.has(org.id)) {
      map.set(org.id, {
        id: org.id,
        name: org.user?.name || org.handle || 'Event Company',
        handle: org.handle ? `@${org.handle}` : 'Event company',
        avatarUrl: org.user?.avatarUrl,
        isCompany: true,
        verified: !!org.isVerified,
      });
    }
  });
  reels.forEach((r) => {
    if (r?.artist?.id && !map.has(r.artist.id)) {
      map.set(r.artist.id, { ...r.artist, verified: true });
    }
  });
  return Array.from(map.values());
}

export default function SearchScreen({ onOpenEvent, onOpenArtist, onBack }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  const allEvents = useEventsData();
  const allReels = useReelsData();
  const { isFollowing, toggle } = useFollows();

  const artists = useMemo(() => deriveArtists(allReels, allEvents), [allReels, allEvents]);

  const q = query.trim().toLowerCase();

  const filteredEvents = useMemo(
    () =>
      q
        ? allEvents.filter((e) => {
            const inLineup = (e.lineup || []).some((a) =>
              (a?.name || '').toLowerCase().includes(q),
            );
            const orgName = (
              e.organizer?.user?.name || e.organizer?.handle || ''
            ).toLowerCase();
            return (
              e.title.toLowerCase().includes(q) ||
              (e.venueName || '').toLowerCase().includes(q) ||
              (e.cityName || '').toLowerCase().includes(q) ||
              (e.category || '').toLowerCase().includes(q) ||
              orgName.includes(q) ||
              inLineup
            );
          })
        : allEvents.slice(0, 5),
    [q, allEvents],
  );
  const filteredArtists = useMemo(
    () => (q ? artists.filter((a) => (a.name || '').toLowerCase().includes(q)) : artists),
    [q, artists],
  );

  const showEvents = tab === 'all' || tab === 'events';
  const showArtists = tab === 'all' || tab === 'artists';

  const noResults = q && filteredEvents.length === 0 && filteredArtists.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScreenHeader title="Search" onBack={onBack} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholder="Search on stage"
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

      {/* flexGrow:0 keeps this row its natural height — it was previously
          getting squeezed and the category chips rendered clipped. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsBar}
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
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.sectionLabel}>Artists & companies</Text>
            {filteredArtists.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => onOpenArtist && onOpenArtist(a.id)}
              >
                <Avatar uri={a.avatarUrl} name={a.name} size={44} verified={a.verified} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{a.name}</Text>
                  <Text style={styles.rowSub}>{a.isCompany ? 'Event company' : a.handle}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.followPill, isFollowing(a.id) && styles.followPillActive]}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    toggle(a.id);
                  }}
                >
                  <Text style={[styles.followPillText, isFollowing(a.id) && styles.followPillTextActive]}>
                    {isFollowing(a.id) ? 'Following' : 'Follow'}
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

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

SearchScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenArtist: PropTypes.func,
  onBack: PropTypes.func,
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
  // flexShrink too: ScrollView defaults to 1, so a long result list below
  // could still squeeze (and clip) the chip row.
  tabsBar: { flexGrow: 0, flexShrink: 0 },
  tabs: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
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
});
