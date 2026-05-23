import React, { useMemo } from 'react';
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
  EventCard,
  StatPill,
  SectionHeader,
} from '../../../shared/components';
import { useEventsData, useReelsData, useUser } from '../../../shared/hooks';
import TrendChart from '../components/TrendChart';

function formatK(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Derive a 7-day "reels published" trend from the artist's own reels.
 * Cheap, real, no mocks — and the chart automatically scales to whatever
 * the artist has actually posted.
 */
function buildWeeklyTrend(reels) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  // Anchor on Monday (ISO weekday: Mon=1 .. Sun=7; JS Sun=0).
  const day = weekStart.getDay();
  const offset = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - offset);

  reels.forEach((r) => {
    if (!r.publishedAt) return;
    const d = new Date(r.publishedAt);
    const diffDays = Math.floor((d - weekStart) / (24 * 3600 * 1000));
    if (diffDays >= 0 && diffDays < 7) {
      buckets[diffDays] += r.views || 0;
    }
  });
  return labels.map((label, i) => ({ label, value: buckets[i] }));
}

export default function ArtistHomeScreen({
  onCreateReel,
  onCreateEvent,
  onOpenEvent,
  onOpenVerification,
  onOpenInsights,
  onOpenReelEditor,
  onOpenProfile,
  onSwitchToCustomer,
}) {
  const { user, artist } = useUser();
  const allReels = useReelsData();
  const allEvents = useEventsData();

  const reels = useMemo(
    () => (artist ? allReels.filter((r) => r.artist?.id === artist.id) : []),
    [allReels, artist],
  );
  const events = useMemo(
    () => (artist ? allEvents.filter((e) => e.organizerArtistId === artist.id) : []),
    [allEvents, artist],
  );
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= Date.now());
  const verifiedOk = !!artist?.isVerified;

  const trend = useMemo(() => buildWeeklyTrend(reels), [reels]);

  // Stats from real records (or zeroes when the user is brand-new).
  const followers = artist?.followerCount ?? artist?._count?.followers ?? 0;
  const totalReelViews = reels.reduce((s, r) => s + (r.views || 0), 0);
  const totalEventTickets = artist?.totalEventTickets ?? 0;
  const totalReactions = reels.reduce((s, r) => {
    const codes = r.stats?.reactions || {};
    return s + Object.values(codes).reduce((a, b) => a + b, 0);
  }, 0);
  const engagementPct =
    totalReelViews > 0
      ? `${Math.min(100, Math.round((totalReactions / totalReelViews) * 100))}%`
      : '—';

  const displayName = artist?.user?.name || user?.name || 'Artist';
  const avatarUrl = user?.avatarUrl || artist?.user?.avatarUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Greeting / hero */}
        <View style={styles.head}>
          <View style={styles.headRow}>
            <Avatar uri={avatarUrl} name={displayName} size={48} verified={verifiedOk} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Welcome back</Text>
              <Text style={styles.name}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              activeOpacity={0.7}
              onPress={onSwitchToCustomer}
            >
              <Ionicons name="swap-horizontal" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.statusCard, !verifiedOk && styles.statusCardWarn]}
            onPress={onOpenVerification}
            activeOpacity={0.85}
          >
            <View style={styles.statusIconWrap}>
              <Ionicons
                name={verifiedOk ? 'shield-checkmark' : 'time-outline'}
                size={18}
                color={verifiedOk ? '#000' : COLORS.warn}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {verifiedOk
                  ? 'Verified Artist'
                  : artist
                  ? 'Verification pending'
                  : 'No artist profile yet'}
              </Text>
              <Text style={styles.statusSub}>
                {verifiedOk
                  ? 'You can publish reels and events.'
                  : artist
                  ? 'Submit documents to start publishing.'
                  : 'Create an artist profile to publish reels and events.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* KPI grid — real numbers from the artist record + reels list */}
        <View style={styles.kpiGrid}>
          <StatPill
            icon="people-outline"
            label="Followers"
            value={formatK(followers)}
          />
          <StatPill
            icon="play-outline"
            label="Reel views"
            value={formatK(totalReelViews)}
            accent
          />
        </View>
        <View style={[styles.kpiGrid, { marginTop: SPACING.sm }]}>
          <StatPill
            icon="ticket-outline"
            label="Tickets sold"
            value={formatK(totalEventTickets)}
          />
          <StatPill
            icon="flame-outline"
            label="Engagement"
            value={engagementPct}
          />
        </View>

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          <ActionTile
            icon="film-outline"
            label="New Reel"
            sub="Edit & publish"
            accent
            onPress={onCreateReel}
          />
          <ActionTile
            icon="calendar-outline"
            label="New Event"
            sub="Schedule a show"
            onPress={onCreateEvent}
          />
        </View>
        <View style={[styles.actionsRow, { marginTop: SPACING.sm }]}>
          <ActionTile
            icon="bar-chart-outline"
            label="Insights"
            sub="See what's hitting"
            onPress={onOpenInsights}
          />
          <ActionTile
            icon="brush-outline"
            label="Edit Profile"
            sub="Public artist page"
            onPress={onOpenProfile}
          />
        </View>

        {/* This week chart */}
        <SectionHeader title="This week" kicker="REEL VIEWS" />
        <View style={{ paddingHorizontal: SPACING.base }}>
          <TrendChart data={trend} />
        </View>

        {/* Upcoming events */}
        <SectionHeader title="Your upcoming events" action="Manage" onActionPress={onOpenInsights} />
        <View style={{ paddingHorizontal: SPACING.base }}>
          {upcoming.length === 0 ? (
            <View style={styles.emptyMini}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyMiniText}>No upcoming events scheduled</Text>
            </View>
          ) : (
            upcoming.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                variant="compact"
                onPress={() => onOpenEvent && onOpenEvent(e.id)}
              />
            ))
          )}
        </View>

        {/* Recent reels */}
        <SectionHeader title="Top reels" action="See all" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reelsStrip}
        >
          {reels.length === 0 ? (
            <View style={styles.emptyMini}>
              <Ionicons name="film-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyMiniText}>No reels yet</Text>
            </View>
          ) : (
            reels.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.reelCard}
                activeOpacity={0.85}
                onPress={() => onOpenReelEditor && onOpenReelEditor(r.id)}
              >
                <View style={[styles.reelCover, { backgroundColor: r.coverColor || COLORS.surface2 }]}>
                  <Ionicons name="play" size={24} color="rgba(255,255,255,0.5)" />
                  <View style={styles.reelStat}>
                    <Ionicons name="eye-outline" size={11} color="#fff" />
                    <Text style={styles.reelStatText}>{formatK(r.views || 0)}</Text>
                  </View>
                </View>
                <Text style={styles.reelCaption} numberOfLines={2}>{r.caption}</Text>
                <View style={styles.reelEditPill}>
                  <Ionicons name="cut-outline" size={11} color={COLORS.highlight} />
                  <Text style={styles.reelEditText}>Edit</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function ActionTile({ icon, label, sub, accent, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.action, accent && styles.actionAccent]}
    >
      <View style={[styles.actionIcon, accent && styles.actionIconAccent]}>
        <Ionicons name={icon} size={18} color={accent ? '#000' : COLORS.accent} />
      </View>
      <Text style={[styles.actionLabel, accent && styles.actionLabelAccent]}>{label}</Text>
      <Text style={[styles.actionSub, accent && styles.actionSubAccent]}>{sub}</Text>
    </TouchableOpacity>
  );
}

ActionTile.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  sub: PropTypes.string,
  accent: PropTypes.bool,
  onPress: PropTypes.func,
};

ArtistHomeScreen.propTypes = {
  onCreateReel: PropTypes.func,
  onCreateEvent: PropTypes.func,
  onOpenEvent: PropTypes.func,
  onOpenVerification: PropTypes.func,
  onOpenInsights: PropTypes.func,
  onOpenReelEditor: PropTypes.func,
  onOpenProfile: PropTypes.func,
  onSwitchToCustomer: PropTypes.func,
};

const TOP = SPACING.huge;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  head: {
    paddingTop: TOP + SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  hello: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  name: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,255,161,0.06)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,161,0.25)',
    marginTop: SPACING.lg,
  },
  statusCardWarn: {
    backgroundColor: 'rgba(255,176,32,0.08)',
    borderColor: 'rgba(255,176,32,0.3)',
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  statusSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  action: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  actionAccent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAccent: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  actionLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  actionLabelAccent: { color: '#000' },
  actionSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionSubAccent: { color: 'rgba(0,0,0,0.7)' },

  reelsStrip: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  reelCard: {
    width: 168,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  reelCover: {
    height: 200,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reelStat: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reelStatText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: '#fff',
  },
  reelCaption: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    minHeight: 32,
  },
  reelEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,255,161,0.1)',
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  reelEditText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.highlight,
  },

  emptyMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    borderStyle: 'dashed',
  },
  emptyMiniText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
});
