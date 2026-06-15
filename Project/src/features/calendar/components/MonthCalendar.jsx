import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const VIEWS = ['Year', 'Month', 'Day'];

function buildMonthMatrix(year, monthIdx) {
  const first = new Date(Date.UTC(year, monthIdx, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  // Monday = 0 ... Sunday = 6 (we display M-S)
  const startDow = (first.getUTCDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function pad(n) { return String(n).padStart(2, '0'); }

/**
 * edmcalendar-style date navigator with Year / Month / Day modes.
 *
 *   - Year:  12 mini-month cells; months with events highlighted. Tap → Month.
 *   - Month: full day grid with event dots (default).
 *   - Day:   compact single-day strip; the event list lives below in the screen.
 *
 * Prev/next arrows step by the active unit. The parent owns the
 * year/monthIdx/selectedDate state and the `view` mode.
 */
export default function MonthCalendar({
  view = 'month',
  onChangeView,
  year,
  monthIdx,
  selectedDate, // 'YYYY-MM-DD'
  eventDayKeys, // Set<'YYYY-MM-DD'>
  eventMonths, // Set<monthIdx> for the Year view
  onSelectDate,
  onSelectMonth,
  onPrev,
  onNext,
}) {
  const cells = useMemo(() => buildMonthMatrix(year, monthIdx), [year, monthIdx]);
  const todayKey = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  })();

  const headerTitle =
    view === 'Year' || view === 'year'
      ? `${year}`
      : view === 'Day' || view === 'day'
      ? formatDayTitle(selectedDate)
      : MONTHS[monthIdx];
  const headerSub = view === 'Month' || view === 'month' ? `${year}` : '';

  const v = capitalize(view);

  return (
    <View style={styles.wrap}>
      {/* View switch */}
      <View style={styles.segment}>
        {VIEWS.map((label) => {
          const active = v === label;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              activeOpacity={0.8}
              onPress={() => onChangeView && onChangeView(label)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Header with unit-aware arrows */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.monthLabel}>{headerTitle}</Text>
          {headerSub ? <Text style={styles.yearLabel}>{headerSub}</Text> : null}
        </View>
        <TouchableOpacity onPress={onNext} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {v === 'Year' ? (
        <View style={styles.yearGrid}>
          {MONTHS_SHORT.map((m, i) => {
            const hasEvents = eventMonths && eventMonths.has(i);
            const isCurrent = i === monthIdx;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.yearCell,
                  hasEvents && styles.yearCellActive,
                  isCurrent && styles.yearCellCurrent,
                ]}
                activeOpacity={0.8}
                onPress={() => onSelectMonth && onSelectMonth(i)}
              >
                <Text style={[styles.yearCellText, hasEvents && styles.yearCellTextActive]}>
                  {m}
                </Text>
                {hasEvents ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : v === 'Day' ? (
        <View style={styles.dayStrip}>
          <Ionicons name="calendar-clear-outline" size={18} color={COLORS.accent} />
          <Text style={styles.dayStripText}>
            {eventDayKeys && eventDayKeys.has(selectedDate)
              ? 'Events scheduled — see below'
              : 'Nothing scheduled this day'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={`${d}-${i}`} style={styles.weekday}>{d}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={styles.cell} />;
              const dateKey = `${year}-${pad(monthIdx + 1)}-${pad(day)}`;
              const hasEvent = eventDayKeys && eventDayKeys.has(dateKey);
              const isSelected = selectedDate === dateKey;
              const isToday = todayKey === dateKey;
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={styles.cell}
                  activeOpacity={0.7}
                  onPress={() => onSelectDate(dateKey)}
                >
                  <View
                    style={[
                      styles.dayBubble,
                      isToday && !isSelected && styles.dayBubbleToday,
                      isSelected && styles.dayBubbleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && !isSelected && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasEvent ? (
                    <View style={[styles.dot, isSelected && { backgroundColor: '#000' }]} />
                  ) : (
                    <View style={styles.dotPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

function capitalize(s) {
  if (!s) return 'Month';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDayTitle(key) {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00Z');
  return d.toLocaleDateString('en', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

MonthCalendar.propTypes = {
  view: PropTypes.string,
  onChangeView: PropTypes.func,
  year: PropTypes.number.isRequired,
  monthIdx: PropTypes.number.isRequired,
  selectedDate: PropTypes.string,
  eventDayKeys: PropTypes.instanceOf(Set),
  eventMonths: PropTypes.instanceOf(Set),
  onSelectDate: PropTypes.func.isRequired,
  onSelectMonth: PropTypes.func,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface1,
    marginHorizontal: SPACING.base,
    borderRadius: RADII.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.pill,
    padding: 3,
    marginBottom: SPACING.md,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADII.pill,
  },
  segmentItemActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
  },
  segmentTextActive: {
    color: '#000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  monthLabel: {
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  yearLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginBottom: SPACING.xs,
  },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleToday: {
    borderWidth: 1,
    borderColor: COLORS.highlight,
  },
  dayBubbleSelected: {
    backgroundColor: COLORS.accent,
  },
  dayText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  dayTextToday: {
    color: COLORS.highlight,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  dayTextSelected: {
    color: '#000',
    fontFamily: FONT_FAMILY.bodyBold,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
  // Year view
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  yearCell: {
    width: `${100 / 3}%`,
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  yearCellActive: {},
  yearCellCurrent: {},
  yearCellText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  yearCellTextActive: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  // Day view
  dayStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  dayStripText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
});
