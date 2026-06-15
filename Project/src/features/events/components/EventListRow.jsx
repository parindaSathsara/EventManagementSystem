import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

/**
 * One event in a company's list:
 *   Title (left)                         Date (right)
 *   Time                                 Place (under the time)
 */
export default function EventListRow({ event, onPress }) {
  const d = new Date(event.startsAt);
  const date = d.toLocaleDateString('en', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <View style={styles.metaLine}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.place} numberOfLines={1}>
            {event.venueName}{event.cityName ? ` · ${event.cityName}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.date}>{date}</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

EventListRow.propTypes = {
  event: PropTypes.object.isRequired,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    gap: SPACING.sm,
  },
  left: { flex: 1, gap: 3 },
  title: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  place: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  date: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
});
