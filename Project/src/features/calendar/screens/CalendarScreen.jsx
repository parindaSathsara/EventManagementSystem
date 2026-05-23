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
import { COLORS, SPACING } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Chip, EventCard, ScreenHeader, EmptyState } from '../../../shared/components';
import { useEventsData } from '../../../shared/hooks';
import {
  CATEGORIES,
  dayKeysWithEvents,
  eventsForDay,
  eventsByMonth,
} from '../../events/utils/eventDates';
import { distanceKm as haversineKm } from '../../../services/geo';
import { DEFAULT_LOCATION } from '../../../services/config';
import MonthCalendar from '../components/MonthCalendar';
import LocationBar from '../components/LocationBar';
import LocationPickerSheet from '../components/LocationPickerSheet';

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatLongDate(key) {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00Z');
  return d.toLocaleDateString('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

export default function CalendarScreen({ onOpenEvent, onOpenSearch }) {
  // Default the calendar to May 2026 — that's where our mock events live for the demo.
  const [year, setYear] = useState(2026);
  const [monthIdx, setMonthIdx] = useState(4); // May
  const [selectedDate, setSelectedDate] = useState('2026-05-12');
  const [category, setCategory] = useState('All');
  const [nearMeOn, setNearMeOn] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [pickerOpen, setPickerOpen] = useState(false);

  const allEvents = useEventsData();

  // Compute distance per event from the picked location, then apply filters.
  const eventsWithDistance = useMemo(() => {
    return allEvents.map((e) => {
      const lat = e.geo?.lat;
      const lng = e.geo?.lng;
      const km = haversineKm(location.lat, location.lng, lat, lng);
      return { ...e, distanceKm: km != null ? km : e.distanceKm };
    });
  }, [allEvents, location.lat, location.lng]);

  const events = useMemo(() => {
    return eventsWithDistance.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (nearMeOn && e.distanceKm != null && e.distanceKm > radiusKm) return false;
      return true;
    });
  }, [eventsWithDistance, category, nearMeOn, radiusKm]);

  const monthEvents = useMemo(
    () => eventsByMonth(events, year, monthIdx),
    [events, year, monthIdx],
  );
  const dayKeys = useMemo(() => dayKeysWithEvents(monthEvents), [monthEvents]);
  const dayEvents = useMemo(
    () => eventsForDay(events, selectedDate),
    [events, selectedDate],
  );

  function navigateMonth(delta) {
    let m = monthIdx + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonthIdx(m);
    setYear(y);
  }

  function handleLocationPick(place) {
    setLocation({
      name: place.name,
      shortName: place.shortName || place.name,
      lat: place.lat,
      lng: place.lng,
    });
    setPickerOpen(false);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />

      <ScreenHeader
        title="Calendar"
        subtitle={`What's on near ${location.shortName}`}
        rightIcon="search-outline"
        onRightPress={onOpenSearch}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <MonthCalendar
          year={year}
          monthIdx={monthIdx}
          selectedDate={selectedDate}
          eventDayKeys={dayKeys}
          onSelectDate={setSelectedDate}
          onPrev={() => navigateMonth(-1)}
          onNext={() => navigateMonth(1)}
        />

        <LocationBar
          location={location.name}
          radiusKm={radiusKm}
          nearMeOn={nearMeOn}
          onToggleNearMe={setNearMeOn}
          onChangeLocation={() => setPickerOpen(true)}
          onChangeRadius={setRadiusKm}
        />

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                active={category === c}
                onPress={() => setCategory(c)}
                style={{ marginRight: SPACING.sm }}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.dayHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayTitle}>{formatLongDate(selectedDate)}</Text>
            <Text style={styles.daySub}>
              {dayEvents.length === 0
                ? 'Nothing scheduled'
                : `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''} · ${location.shortName}`}
            </Text>
          </View>
          {selectedDate !== todayKey() ? (
            <Chip
              label="Today"
              icon="time-outline"
              onPress={() => {
                setSelectedDate(todayKey());
                const d = new Date();
                setYear(d.getUTCFullYear());
                setMonthIdx(d.getUTCMonth());
              }}
            />
          ) : null}
        </View>

        <View style={styles.eventsList}>
          {dayEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events on this day"
              message={`Nothing scheduled in ${location.shortName} for the picked filters. Try expanding the radius or changing the location.`}
            />
          ) : (
            dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => onOpenEvent && onOpenEvent(event.id)}
              />
            ))
          )}
        </View>

        {/* This month strip */}
        {monthEvents.length > 0 ? (
          <View style={{ marginTop: SPACING.lg }}>
            <View style={styles.weekHeader}>
              <Ionicons name="flash" size={14} color={COLORS.highlight} />
              <Text style={styles.weekTitle}>This month near {location.shortName}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendStrip}
            >
              {monthEvents.slice(0, 6).map((e) => (
                <View key={e.id} style={styles.trendCard}>
                  <EventCard event={e} variant="compact" onPress={() => onOpenEvent && onOpenEvent(e.id)} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      <LocationPickerSheet
        visible={pickerOpen}
        current={location}
        onClose={() => setPickerOpen(false)}
        onPick={handleLocationPick}
      />
    </View>
  );
}

CalendarScreen.propTypes = {
  onOpenEvent: PropTypes.func,
  onOpenSearch: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  scroll: { paddingBottom: SPACING.xxl },
  filterRow: {
    marginTop: SPACING.lg,
  },
  filterContent: {
    paddingHorizontal: SPACING.base,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  dayTitle: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  daySub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    marginTop: 2,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  eventsList: {
    paddingHorizontal: SPACING.base,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    gap: 6,
    marginBottom: SPACING.sm,
  },
  weekTitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  trendStrip: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  trendCard: {
    width: 280,
  },
});
