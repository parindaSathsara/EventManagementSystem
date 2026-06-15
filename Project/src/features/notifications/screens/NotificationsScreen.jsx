import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError, EmptyState } from '../../../shared/components';
import { useNotificationsData, useEventsData, useFollows } from '../../../shared/hooks';
import { notificationScheduler } from '../../../services';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

/**
 * Notifications tab — event reminders 1 and 2 days before showtime.
 *
 * The in-app feed comes from the backend (GET /notifications). Separately, we
 * schedule on-device local notifications (T-2 / T-1) for the events whose
 * company the guest follows, so they get alerted even with the app closed.
 */
export default function NotificationsScreen({ onOpenEvent, onManagerLogin }) {
  const items = useNotificationsData();
  const events = useEventsData();
  const { ids, isFollowing } = useFollows();

  // (Re)schedule local reminders whenever follows or events change.
  const followedUpcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e?.organizer?.id && isFollowing(e.organizer.id))
      .filter((e) => new Date(e.startsAt).getTime() > now)
      .map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, venueName: e.venueName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, ids]);

  useEffect(() => {
    notificationScheduler.syncReminders(followedUpcoming).catch(() => {});
  }, [followedUpcoming]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={items.refresh} tintColor={COLORS.accent} />
        }
      >
        {items.error && items.length === 0 ? (
          <ConnectionError error={items.error} onRetry={items.refresh} loading={items.loading} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="You're all caught up"
            message="Reminders for events happening in the next 2 days will show up here. Follow a company to get on-device alerts."
          />
        ) : (
          items.map((n) => <ReminderCard key={n.id} item={n} onPress={() => onOpenEvent && onOpenEvent(n.eventId)} />)
        )}

        {/* Register-as-event-manager CTA */}
        <TouchableOpacity style={styles.ctaCard} activeOpacity={0.85} onPress={onManagerLogin}>
          <View style={styles.ctaIcon}>
            <Ionicons name="mic-outline" size={22} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Organising events?</Text>
            <Text style={styles.ctaSub}>Register as an event manager to publish and sell tickets.</Text>
          </View>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Register</Text>
            <Ionicons name="arrow-forward" size={14} color="#000" />
          </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function ReminderCard({ item, onPress }) {
  const d = new Date(item.startsAt);
  const when = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  const urgent = item.daysUntil === 1;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.badge, urgent ? styles.badgeUrgent : styles.badgeSoon]}>
        <Ionicons name="alarm-outline" size={16} color={urgent ? '#000' : COLORS.accent} />
        <Text style={[styles.badgeText, urgent && styles.badgeTextUrgent]}>
          {urgent ? 'Tomorrow' : 'In 2 days'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{when} · {time}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{item.venueName}{item.cityName ? ` · ${item.cityName}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

ReminderCard.propTypes = { item: PropTypes.object.isRequired, onPress: PropTypes.func };

NotificationsScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onManagerLogin: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  header: {
    paddingTop: TOP,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,84,130,0.06)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(255,84,130,0.3)',
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  ctaSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  ctaBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
  },
  card: {
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
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.sm || 10,
    minWidth: 72,
  },
  badgeUrgent: { backgroundColor: COLORS.highlight },
  badgeSoon: { backgroundColor: 'rgba(255,84,130,0.12)' },
  badgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  badgeTextUrgent: { color: '#000' },
  cardTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  cardMeta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
