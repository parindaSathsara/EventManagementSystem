import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Avatar,
  Chip,
  ScreenHeader,
  SectionHeader,
} from '../../../shared/components';
import { useEventsData, useReelsData, useAlert, useUser } from '../../../shared/hooks';

const TABS = [
  { key: 'events', label: 'Events' },
  // { key: 'reels', label: 'Reels' },  // Reels disabled for now.
  { key: 'about', label: 'About' },
];

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function dateBadge(iso) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  };
}

export default function ArtistMyProfileScreen({
  onSwitchToCustomer,
  onOpenVerification,
  onCreateEvent,
  onCreateReel,
  onEditProfile,
  onLogout,
}) {
  const [tab, setTab] = useState('events');
  const allReels = useReelsData();
  const allEvents = useEventsData();
  const alert = useAlert();
  const { user, artist } = useUser();
  const reels = artist ? allReels.filter((r) => r.artist && r.artist.id === artist.id) : [];
  const events = artist ? allEvents.filter((e) => e.organizerArtistId === artist.id) : [];

  // Derived display values — fall back to the auth user when an artist
  // profile hasn't been created yet, so the page still renders something.
  const displayName = artist?.user?.name || user?.name || 'Artist';
  const displayHandle = artist?.handle ? `@${artist.handle}` : (user?.email ? `@${user.email.split('@')[0]}` : '');
  const avatarUrl = user?.avatarUrl || artist?.user?.avatarUrl;
  const bio = artist?.bio || 'Tell people who you are — add a bio in Edit profile.';
  const cityName = artist?.user?.city || user?.city || '';
  const followers = artist?.followerCount ?? artist?._count?.followers ?? 0;
  const totalReelViews = reels.reduce((s, r) => s + (r.views || 0), 0);

  // Socials: backend stores as JSON blob; parse defensively.
  let socials = {};
  try {
    socials = artist?.socialsJson ? JSON.parse(artist.socialsJson) : {};
  } catch {
    socials = {};
  }

  function handleEditProfile() {
    if (onEditProfile) {
      onEditProfile();
    } else {
      alert.info('Edit profile', 'Open from the Profile tab.');
    }
  }
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= Date.now());
  const past = events.filter((e) => new Date(e.startsAt).getTime() < Date.now());

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title={displayName}
        subtitle={displayHandle}
        rightIcon="ellipsis-horizontal"
        onRightPress={() =>
          alert.info(
            'Profile menu',
            'Share your profile, copy public link, view as customer — coming next sprint.',
          )
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.head}>
          <Avatar uri={avatarUrl} name={displayName} size={88} verified={!!artist?.isVerified} ring />
          <Text style={styles.name}>{displayName}</Text>
          {artist?.isVerified ? (
            <View style={{ marginTop: SPACING.xs }}>
              <Chip
                label="Verified Artist"
                variant="verified"
                icon="shield-checkmark"
                onPress={onOpenVerification}
              />
            </View>
          ) : null}
          <Text style={styles.bio}>{bio}</Text>

          <View style={styles.statsRow}>
            <Stat value={fmt(followers)} label="Followers" />
            <Stat value={String(reels.length)} label="Reels" />
            <Stat value={String(events.length)} label="Events" />
            <Stat value={fmt(totalReelViews)} label="Views" />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={handleEditProfile}>
              <Ionicons name="brush-outline" size={14} color="#000" />
              <Text style={styles.editBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.85}
              onPress={onSwitchToCustomer}
            >
              <Ionicons name="swap-horizontal" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tabBtn}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {tab === t.key ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'events' ? (
          <View style={{ paddingHorizontal: SPACING.base }}>
            <SectionHeader title="Upcoming" action="+ New" onActionPress={onCreateEvent} />
            {upcoming.length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.emptyMiniText}>No upcoming shows</Text>
              </View>
            ) : (
              upcoming.map((e) => <EventListRow key={e.id} event={e} />)
            )}

            {past.length > 0 ? (
              <>
                <SectionHeader title="Past events" />
                {past.map((e) => <EventListRow key={e.id} event={e} muted />)}
              </>
            ) : null}
          </View>
        ) : null}

        {/* Reels tab disabled for now — everything is an event. */}

        {tab === 'about' ? (
          <View style={{ paddingHorizontal: SPACING.base }}>
            <SectionHeader title="Bio" />
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{bio}</Text>
            </View>

            <SectionHeader title="Socials" />
            <View style={styles.aboutCard}>
              <SocialRow icon="logo-instagram" label="Instagram" value={socials.instagram || '—'} />
              <SocialRow icon="musical-notes" label="Spotify" value={socials.spotify || '—'} />
              <SocialRow icon="logo-youtube" label="YouTube" value={socials.youtube || '—'} />
            </View>

            <SectionHeader title="Location" />
            <View style={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.accent} />
                <Text style={styles.aboutRowText}>{cityName || '—'}</Text>
              </View>
            </View>

            {onLogout ? (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={styles.logoutBtnText}>Log out</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventListRow({ event, muted }) {
  const { day, month } = dateBadge(event.startsAt);
  return (
    <View style={[styles.eventRow, muted && { opacity: 0.55 }]}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {event.venueName} · {event.cityName}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </View>
  );
}

function SocialRow({ icon, label, value }) {
  return (
    <View style={styles.aboutRow}>
      <Ionicons name={icon} size={16} color={COLORS.accent} />
      <Text style={styles.aboutRowLabel}>{label}</Text>
      <Text style={styles.aboutRowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

Stat.propTypes = { value: PropTypes.string, label: PropTypes.string };
EventListRow.propTypes = { event: PropTypes.object, muted: PropTypes.bool };
SocialRow.propTypes = { icon: PropTypes.string, label: PropTypes.string, value: PropTypes.string };

ArtistMyProfileScreen.propTypes = {
  onSwitchToCustomer: PropTypes.func,
  onOpenVerification: PropTypes.func,
  onCreateEvent: PropTypes.func,
  onCreateReel: PropTypes.func,
  onEditProfile: PropTypes.func,
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  head: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  name: { ...TYPE_SCALE.h3, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary, marginTop: SPACING.md },
  bio: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    paddingVertical: SPACING.md,
    width: '100%',
    marginTop: SPACING.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...TYPE_SCALE.title, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  statLabel: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, alignSelf: 'stretch' },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  editBtnText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: '#000' },
  shareBtn: {
    width: 48,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
    marginBottom: SPACING.sm,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  tabLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  tabLabelActive: { color: COLORS.textPrimary, fontFamily: FONT_FAMILY.headingSemiBold },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '40%',
    height: 2,
    backgroundColor: COLORS.accent,
  },

  emptyMini: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    borderStyle: 'dashed',
    borderRadius: RADII.md,
  },
  emptyMiniText: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    marginBottom: SPACING.sm,
  },
  dateBadge: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 46,
  },
  dateMonth: { fontSize: 10, letterSpacing: 1, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  dateDay: { fontSize: 18, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary, marginTop: -2 },
  eventTitle: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  eventMeta: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
  },
  newReelTile: {
    width: '32%',
    aspectRatio: 0.66,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255,84,130,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,84,130,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  newReelText: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.accent },
  reelTile: {
    width: '32%',
    aspectRatio: 0.66,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelTileFoot: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reelTileViews: { fontSize: 10, fontFamily: FONT_FAMILY.bodySemiBold, color: '#fff' },

  aboutCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  aboutText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingVertical: SPACING.md,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
    gap: SPACING.sm,
  },
  aboutRowText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textPrimary,
  },
  aboutRowLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    width: 70,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  aboutRowValue: {
    flex: 1,
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.4)',
    backgroundColor: 'rgba(255,92,122,0.06)',
  },
  logoutBtnText: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.error,
  },
});
