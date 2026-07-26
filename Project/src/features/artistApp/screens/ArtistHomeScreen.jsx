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
import { useEventsData, useUser } from '../../../shared/hooks';

function formatK(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Organizer home — trimmed to essentials per client feedback:
 * Followers + a countdown to the next event, quick actions (New Event /
 * Edit Profile), and the active & upcoming events list (moved here from
 * Insights) with an Edit shortcut on each row.
 */
export default function ArtistHomeScreen({
  onCreateEvent,
  onOpenEvent,
  onEditEvent,
  onOpenVerification,
  onOpenMyEvents,
  onOpenProfile,
  onSwitchToCustomer,
}) {
  const { user, artist } = useUser();
  const allEvents = useEventsData();

  const events = useMemo(
    () => (artist ? allEvents.filter((e) => e.organizerArtistId === artist.id) : []),
    [allEvents, artist],
  );
  const active = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e.status === 'live' || new Date(e.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [events]);
  const verifiedOk = !!artist?.isVerified;

  const followers = artist?.followerCount ?? artist?._count?.followers ?? 0;
  // Day count — days until the next upcoming event.
  const next = active.find((e) => new Date(e.startsAt).getTime() > Date.now());
  const daysToNext = next
    ? Math.max(0, Math.ceil((new Date(next.startsAt).getTime() - Date.now()) / (24 * 3600 * 1000)))
    : null;

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
                  ? 'Verified Organizer'
                  : artist
                  ? 'Verification pending'
                  : 'No organizer profile yet'}
              </Text>
              <Text style={styles.statusSub}>
                {verifiedOk
                  ? 'You can publish events.'
                  : artist
                  ? 'Submit documents to start publishing.'
                  : 'Create a profile to publish events.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* KPIs — Followers + day count to the next event only. */}
        <View style={styles.kpiGrid}>
          <StatPill
            icon="people-outline"
            label="Followers"
            value={formatK(followers)}
          />
          <StatPill
            icon="hourglass-outline"
            label={next ? 'Days to next event' : 'Next event'}
            value={daysToNext != null ? String(daysToNext) : '—'}
            accent
          />
        </View>

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          <ActionTile
            icon="calendar-outline"
            label="New Event"
            sub="Schedule a show"
            accent
            onPress={onCreateEvent}
          />
          <ActionTile
            icon="brush-outline"
            label="Edit Profile"
            sub="Public organizer page"
            onPress={onOpenProfile}
          />
        </View>

        {/* Active & upcoming events (moved here from Insights) */}
        <SectionHeader title="Active events" action="Manage" onActionPress={onOpenMyEvents} />
        <View style={{ paddingHorizontal: SPACING.base }}>
          {active.length === 0 ? (
            <View style={styles.emptyMini}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyMiniText}>No active or upcoming events</Text>
            </View>
          ) : (
            active.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <View style={{ flex: 1 }}>
                  <EventCard
                    event={e}
                    variant="compact"
                    onPress={() => onOpenEvent && onOpenEvent(e.id)}
                  />
                </View>
                <TouchableOpacity
                  style={styles.editPill}
                  activeOpacity={0.8}
                  onPress={() => onEditEvent && onEditEvent(e.id)}
                >
                  <Ionicons name="brush-outline" size={14} color="#000" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  onCreateEvent: PropTypes.func,
  onOpenEvent: PropTypes.func,
  onEditEvent: PropTypes.func,
  onOpenVerification: PropTypes.func,
  onOpenMyEvents: PropTypes.func,
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
    backgroundColor: 'rgba(255,82,82,0.06)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.25)',
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
    backgroundColor: 'rgba(255,59,59,0.14)',
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

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
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
