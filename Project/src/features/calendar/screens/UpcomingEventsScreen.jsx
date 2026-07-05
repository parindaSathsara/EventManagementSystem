import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { EventCard, EmptyState } from '../../../shared/components';
import { useEventsData } from '../../../shared/hooks';
import { eventsByMonth, eventsForDay } from '../../events/utils/eventDates';

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;
const VIEWS = ['Year', 'Month', 'Day'];
const VISIBLE_STATUS = new Set(['published', 'live']);

function dayKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * "Upcoming Events" — modelled on edmcalendar.lk. A Year / Month / Day toggle
 * plus a ‹ › stepper that pages the period.
 *
 * Events render as a 2-per-row grid (scales when a month gets busy). Past
 * events are disabled-looking (greyed with an "Ended" tag) but remain
 * tappable so what was on that day can still be seen — per client decision.
 * The discreet event-manager entry lives at the bottom of this screen.
 */
export default function UpcomingEventsScreen({ onOpenEvent, onOpenSearch, onManagerLogin }) {
  const events = useEventsData();
  const [view, setView] = useState('Month');
  const [cursor, setCursor] = useState(() => new Date());

  const published = useMemo(
    () => events.filter((e) => !e.status || VISIBLE_STATUS.has(e.status)),
    [events],
  );

  const { label, list } = useMemo(() => {
    if (view === 'Day') {
      const items = eventsForDay(published, cursor.toISOString().slice(0, 10)).slice();
      // eventsForDay matches the ISO prefix; cursor uses local — normalise via UTC key.
      const byUtc = published.filter((e) => (e.startsAt || '').slice(0, 10) === dayKey(cursor));
      const use = byUtc.length ? byUtc : items;
      return {
        label: cursor.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        list: use.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
      };
    }
    if (view === 'Year') {
      const y = cursor.getUTCFullYear();
      return {
        label: String(y),
        list: published
          .filter((e) => new Date(e.startsAt).getUTCFullYear() === y)
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
      };
    }
    // Month
    return {
      label: cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
      list: eventsByMonth(published, cursor.getUTCFullYear(), cursor.getUTCMonth())
        .slice()
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    };
  }, [view, cursor, published]);

  function step(dir) {
    const d = new Date(cursor);
    if (view === 'Day') d.setDate(d.getDate() + dir);
    else if (view === 'Year') d.setFullYear(d.getFullYear() + dir);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  }

  const now = Date.now();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Events</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenSearch} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Year / Month / Day toggle */}
      <View style={styles.toggle}>
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setView(v)}
            activeOpacity={0.8}
            style={[styles.segment, view === v && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ‹ period › stepper */}
      <View style={styles.stepper}>
        <TouchableOpacity onPress={() => step(-1)} style={styles.stepBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{label}</Text>
        <TouchableOpacity onPress={() => step(1)} style={styles.stepBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No events"
            message={`Nothing scheduled for this ${view.toLowerCase()}. Try the ‹ › arrows.`}
          />
        ) : (
          <View style={styles.grid}>
            {list.map((e) => {
              const past = new Date(e.startsAt).getTime() < now;
              return (
                <View key={e.id} style={[styles.gridItem, past && styles.pastWrap]}>
                  {/* Past events stay tappable — the day is "disabled" visually
                      but tapping still shows what was there. */}
                  <EventCard event={e} variant="grid" onPress={() => onOpenEvent && onOpenEvent(e.id)} />
                  {past ? (
                    <View style={styles.expiredBadge} pointerEvents="none">
                      <Text style={styles.expiredText}>Ended</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {/* Keep the last row aligned when the count is odd. */}
            {list.length % 2 === 1 ? <View style={styles.gridItem} /> : null}
          </View>
        )}

        {/* Discreet event-manager entry (moved here from the Alerts tab). */}
        {onManagerLogin ? (
          <TouchableOpacity style={styles.managerCta} activeOpacity={0.8} onPress={onManagerLogin}>
            <Ionicons name="mic-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.managerCtaText}>Organising events? Register as an event manager</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

UpcomingEventsScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenSearch: PropTypes.func,
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
  // Toned down to match the feed's tab-heading size per client feedback.
  title: { fontSize: 15, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: COLORS.accent },
  segmentText: { fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textSecondary },
  segmentTextActive: { color: '#000' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  stepLabel: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  scroll: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridItem: {
    // Two tiles per row — (100% - gap) / 2.
    flexBasis: '48.5%',
    flexGrow: 1,
    position: 'relative',
  },
  pastWrap: { opacity: 0.45 },
  expiredBadge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    right: SPACING.xs + 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  expiredText: { fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, color: '#fff', letterSpacing: 0.5 },
  managerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    borderStyle: 'dashed',
  },
  managerCtaText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
});
