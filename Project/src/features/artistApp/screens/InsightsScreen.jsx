import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  ScreenHeader,
  Chip,
  StatPill,
  SectionHeader,
} from '../../../shared/components';
import { useEventsData, useReelsData, useUser } from '../../../shared/hooks';
import TrendChart from '../components/TrendChart';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildDailyViews(reels, days) {
  const buckets = new Array(days).fill(0);
  const labels = new Array(days);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    labels[i] = days <= 7 ? DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1] : String(d.getDate());
  }
  reels.forEach((r) => {
    if (!r.publishedAt) return;
    const published = new Date(r.publishedAt);
    const diffDays = Math.floor((now - published) / (24 * 3600 * 1000));
    if (diffDays >= 0 && diffDays < days) {
      const idx = days - 1 - diffDays;
      buckets[idx] += r.views || 0;
    }
  });
  return labels.map((label, i) => ({ label, value: buckets[i] }));
}

const RANGES = ['7d', '30d', '90d'];

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function InsightsScreen({ onBack }) {
  const [range, setRange] = useState('7d');
  const { artist } = useUser();

  const allReels = useReelsData();
  const allEvents = useEventsData();
  const reels = useMemo(
    () => (artist ? allReels.filter((r) => r.artist && r.artist.id === artist.id) : []),
    [allReels, artist],
  );
  const events = useMemo(
    () => (artist ? allEvents.filter((e) => e.organizerArtistId === artist.id) : []),
    [allEvents, artist],
  );

  const topReels = [...reels]
    .map((r) => ({
      ...r,
      total: Object.values(r.stats?.reactions || {}).reduce((s, c) => s + c, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Derived KPIs from actual reels (no mocked percentages).
  const totalReelViews = reels.reduce((s, r) => s + (r.views || 0), 0);
  const totalReposts = reels.reduce((s, r) => s + (r.stats?.reposts || 0), 0);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const trend = useMemo(() => buildDailyViews(reels, days), [reels, days]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Insights" onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Chip
              key={r}
              label={r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
              active={range === r}
              onPress={() => setRange(r)}
              style={{ marginRight: SPACING.sm }}
            />
          ))}
        </View>

        <View style={styles.kpiGrid}>
          <StatPill
            icon="play-outline"
            label="Reel views"
            value={fmt(totalReelViews)}
            accent
          />
          <StatPill
            icon="people-outline"
            label="Followers"
            value={fmt(artist?.followerCount ?? 0)}
          />
        </View>
        <View style={[styles.kpiGrid, { marginTop: SPACING.sm }]}>
          <StatPill
            icon="ticket-outline"
            label="Tickets sold"
            value={fmt(artist?.totalEventTickets ?? 0)}
          />
          <StatPill
            icon="repeat-outline"
            label="Reposts"
            value={fmt(totalReposts)}
          />
        </View>

        <SectionHeader title="Daily reel views" kicker={range.toUpperCase()} />
        <View style={{ paddingHorizontal: SPACING.base }}>
          <TrendChart data={trend} />
        </View>

        <SectionHeader title="Top performing reels" />
        <View style={{ paddingHorizontal: SPACING.base }}>
          {topReels.map((r, i) => (
            <View key={r.id} style={styles.reelRow}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <View style={[styles.thumb, { backgroundColor: r.coverColor || COLORS.surface2 }]}>
                <Ionicons name="play" size={16} color="rgba(255,255,255,0.4)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reelTitle} numberOfLines={1}>{r.caption}</Text>
                <Text style={styles.reelMeta}>
                  {fmt(r.views || 0)} views · {fmt(r.total)} reactions
                </Text>
              </View>
              <Ionicons name="trending-up" size={16} color={COLORS.highlight} />
            </View>
          ))}
        </View>

        <SectionHeader title="Active events" />
        <View style={{ paddingHorizontal: SPACING.base }}>
          {events.length === 0 ? (
            <Text style={styles.eventMetrics}>No events to report on yet.</Text>
          ) : (
            events.map((e) => (
              <View key={e.id} style={styles.eventStat}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName} numberOfLines={1}>{e.title}</Text>
                  <Text style={styles.eventMetrics}>
                    {(e.ticketTypes && e.ticketTypes[0]?.remaining) ?? 0} tickets remaining
                  </Text>
                </View>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{(e.status || 'published').toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FunnelRow({ label, value, pct, accent, highlight }) {
  return (
    <View style={styles.funnelRow}>
      <View style={styles.funnelLabelRow}>
        <Text style={styles.funnelLabel}>{label}</Text>
        <Text style={styles.funnelValue}>{value}</Text>
      </View>
      <View style={styles.funnelTrack}>
        <View
          style={[
            styles.funnelFill,
            {
              width: `${pct}%`,
              backgroundColor: highlight
                ? COLORS.highlight
                : accent
                ? COLORS.accent
                : COLORS.lineStrong,
            },
          ]}
        />
      </View>
    </View>
  );
}

FunnelRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  pct: PropTypes.number,
  accent: PropTypes.bool,
  highlight: PropTypes.bool,
};

InsightsScreen.propTypes = {
  onBack: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  rangeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  reelRow: {
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
  rank: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.accent,
    width: 28,
  },
  thumb: {
    width: 44,
    height: 56,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelTitle: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  reelMeta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  funnelCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  funnelRow: {},
  funnelLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  funnelLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  funnelValue: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  funnelTrack: {
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  funnelFill: { height: '100%', borderRadius: 3 },

  eventStat: {
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
  eventName: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  eventMetrics: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  eventBadge: {
    backgroundColor: 'rgba(0,255,161,0.12)',
    borderColor: COLORS.highlight,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  eventBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.highlight,
  },
});
