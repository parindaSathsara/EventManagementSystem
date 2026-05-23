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

function buildMonthMatrix(year, monthIdx) {
  const first = new Date(Date.UTC(year, monthIdx, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  // Monday = 0 ... Sunday = 6 (we display M-S)
  const startDow = (first.getUTCDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  // pad to 6 rows for stable height
  while (cells.length < 42) cells.push(null);
  return cells;
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function MonthCalendar({
  year,
  monthIdx,
  selectedDate, // 'YYYY-MM-DD'
  eventDayKeys, // Set<'YYYY-MM-DD'>
  onSelectDate,
  onPrev,
  onNext,
}) {
  const cells = useMemo(() => buildMonthMatrix(year, monthIdx), [year, monthIdx]);
  const todayKey = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  })();

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.monthLabel}>{MONTHS[monthIdx]}</Text>
          <Text style={styles.yearLabel}>{year}</Text>
        </View>
        <TouchableOpacity onPress={onNext} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) {
            return <View key={`e-${idx}`} style={styles.cell} />;
          }
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
                <View
                  style={[
                    styles.dot,
                    isSelected && { backgroundColor: '#000' },
                  ]}
                />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

MonthCalendar.propTypes = {
  year: PropTypes.number.isRequired,
  monthIdx: PropTypes.number.isRequired,
  selectedDate: PropTypes.string,
  eventDayKeys: PropTypes.instanceOf(Set),
  onSelectDate: PropTypes.func.isRequired,
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
});
