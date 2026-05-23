import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Avatar, Chip, ScreenHeader, EventCard, EmptyState } from '../../../shared/components';
import { useEventsData, useReelsData, useAlert, useUser } from '../../../shared/hooks';
import { reloadAll, reelsRepo } from '../../../services';

const TABS = [
  { key: 'vibes', label: 'My Vibes', icon: 'flame-outline' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
  { key: 'following', label: 'Following', icon: 'people-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export default function CustomerProfileScreen({
  onSwitchToArtist,
  onLogout,
  onOpenEvent,
}) {
  const [tab, setTab] = useState('saved');
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifArtists, setNotifArtists] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [privatePosts, setPrivatePosts] = useState(false);

  const allEvents = useEventsData();
  const allReels = useReelsData();
  const alert = useAlert();
  const { user: authUser } = useUser();

  // Display values derived from the signed-in user (never a hardcoded mock).
  const user = {
    name: authUser?.name || 'Guest',
    handle: authUser?.email ? `@${authUser.email.split('@')[0]}` : '',
    avatarUrl: authUser?.avatarUrl || null,
    city: authUser?.city || '—',
  };

  function handleSettingsAction(label) {
    alert.info(
      label,
      `${label} flow will be wired up in the next sprint. For the demo this is a placeholder.`,
    );
  }

  function handleUnfollow(artist) {
    alert.confirm(
      'Unfollow?',
      `Stop following ${artist.name}? You can re-follow anytime from their profile.`,
      {
        confirmText: 'Unfollow',
        cancelText: 'Keep following',
        onConfirm: () => reelsRepo.toggleFollow(artist.id),
      },
    );
  }

  function handleRefreshData() {
    alert.confirm(
      'Refresh from server?',
      'Pulls the latest events, reels, and tickets from the backend.',
      {
        confirmText: 'Refresh',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await reloadAll();
            alert.success('Refreshed', 'Latest data loaded.');
          } catch (e) {
            alert.error('Could not refresh', e?.message || 'Please try again.');
          }
        },
      },
    );
  }
  const savedEvents = useMemo(() => allEvents.filter((e) => e.isSaved), [allEvents]);
  const reposts = useMemo(() => allReels.filter((r) => r.isReposted), [allReels]);
  const followed = useMemo(() => {
    const seen = new Set();
    const out = [];
    allReels.forEach((r) => {
      if (r.artist && r.artist.isFollowing && !seen.has(r.artist.id)) {
        seen.add(r.artist.id);
        out.push(r.artist);
      }
    });
    return out;
  }, [allReels]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader
        title="Profile"
        rightIcon="notifications-outline"
        onRightPress={() => handleSettingsAction('Notifications')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.head}>
          <Avatar uri={user.avatarUrl} name={user.name} size={80} ring />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{user.city}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{savedEvents.length}</Text><Text style={styles.statLabel}>Saved</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{reposts.length}</Text><Text style={styles.statLabel}>Vibes</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{followed.length}</Text><Text style={styles.statLabel}>Following</Text></View>
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={onSwitchToArtist} activeOpacity={0.85}>
            <Ionicons name="mic-outline" size={16} color={COLORS.highlight} />
            <Text style={styles.switchBtnText}>Switch to Artist</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.highlight} />
          </TouchableOpacity>
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
              icon={t.icon}
              active={tab === t.key}
              onPress={() => setTab(t.key)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </ScrollView>

        <View style={styles.body}>
          {tab === 'saved' ? (
            savedEvents.length === 0 ? (
              <EmptyState
                icon="bookmark-outline"
                title="Nothing saved yet"
                message="Tap the bookmark on any event to keep it here."
              />
            ) : (
              savedEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  variant="compact"
                  onPress={() => onOpenEvent && onOpenEvent(e.id)}
                />
              ))
            )
          ) : null}

          {tab === 'vibes' ? (
            reposts.length === 0 ? (
              <EmptyState icon="flame-outline" title="No reposts yet" message="Your reposts will live here." />
            ) : (
              <View style={styles.gridWrap}>
                {reposts.map((r) => (
                  <View key={r.id} style={styles.gridItem}>
                    <View style={[styles.gridCover, { backgroundColor: r.coverColor || COLORS.surface2 }]}>
                      <Ionicons name="play" size={22} color="rgba(255,255,255,0.45)" />
                    </View>
                    <Text style={styles.gridLabel} numberOfLines={1}>{r.caption}</Text>
                  </View>
                ))}
              </View>
            )
          ) : null}

          {tab === 'following' ? (
            followed.length === 0 ? (
              <EmptyState icon="people-outline" title="Not following anyone" message="Discover artists and follow to keep up." />
            ) : (
              followed.map((a) => (
                <View key={a.id} style={styles.followRow}>
                  <Avatar uri={a.avatarUrl} name={a.name} size={44} verified />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{a.name}</Text>
                    <Text style={styles.rowSub}>{a.handle}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.followingPill}
                    activeOpacity={0.7}
                    onPress={() => handleUnfollow(a)}
                  >
                    <Text style={styles.followingPillText}>Following</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : null}

          {tab === 'settings' ? (
            <View>
              <SettingsGroup title="Notifications">
                <SettingsToggle label="Event reminders" value={notifEvents} onChange={setNotifEvents} />
                <SettingsToggle label="Followed artist updates" value={notifArtists} onChange={setNotifArtists} />
                <SettingsToggle label="Marketing & deals" value={notifMarketing} onChange={setNotifMarketing} />
              </SettingsGroup>

              <SettingsGroup title="Privacy">
                <SettingsToggle
                  label="Make my reposts private"
                  helper="Only you can see what you've reposted"
                  value={privatePosts}
                  onChange={setPrivatePosts}
                />
              </SettingsGroup>

              <SettingsGroup title="Account">
                <SettingsRow icon="person-outline" label="Edit profile" onPress={() => handleSettingsAction('Edit profile')} />
                <SettingsRow icon="card-outline" label="Payment methods" onPress={() => handleSettingsAction('Payment methods')} />
                <SettingsRow icon="help-circle-outline" label="Help & support" onPress={() => handleSettingsAction('Help & support')} />
                <SettingsRow icon="document-text-outline" label="Terms & policies" onPress={() => handleSettingsAction('Terms & policies')} />
              </SettingsGroup>

              <SettingsGroup title="Data">
                <SettingsRow
                  icon="refresh-outline"
                  label="Refresh from server"
                  onPress={handleRefreshData}
                />
              </SettingsGroup>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={styles.logoutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function SettingsToggle({ label, helper, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {helper ? <Text style={styles.toggleHelper}>{helper}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.surface3, true: COLORS.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SettingsRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.toggleRow} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} style={{ marginRight: SPACING.sm }} />
      <Text style={[styles.toggleLabel, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

SettingsGroup.propTypes = { title: PropTypes.string, children: PropTypes.node };
SettingsToggle.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  value: PropTypes.bool,
  onChange: PropTypes.func,
};
SettingsRow.propTypes = { icon: PropTypes.string, label: PropTypes.string, onPress: PropTypes.func };

CustomerProfileScreen.propTypes = {
  onSwitchToArtist: PropTypes.func,
  onLogout: PropTypes.func,
  onOpenEvent: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  head: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  name: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  handle: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  metaText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...TYPE_SCALE.h4, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  statLabel: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.bodyMedium, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.lineSubtle },

  switchBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(0,255,161,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,161,0.3)',
  },
  switchBtnText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.highlight,
  },

  tabs: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  body: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },

  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs },
  gridItem: { width: '50%', padding: SPACING.xs },
  gridCover: {
    height: 140,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  gridLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  followRow: {
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
  rowTitle: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  rowSub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  followingPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  followingPillText: { fontSize: 12, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textSecondary },

  groupLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  groupCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  toggleLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textPrimary,
  },
  toggleHelper: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.4)',
    backgroundColor: 'rgba(255,92,122,0.06)',
  },
  logoutText: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.error,
  },
});
