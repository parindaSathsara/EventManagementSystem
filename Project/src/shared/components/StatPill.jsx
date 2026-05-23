import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY } from '../../theme';

export default function StatPill({ icon, label, value, accent = false, trend }) {
  return (
    <View style={[styles.wrap, accent && styles.wrapAccent]}>
      <View style={styles.row}>
        {icon ? (
          <Ionicons
            name={icon}
            size={14}
            color={accent ? '#000' : COLORS.accent}
          />
        ) : null}
        <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
        {trend ? (
          <View style={[styles.trend, trend.dir === 'down' && styles.trendDown]}>
            <Ionicons
              name={trend.dir === 'down' ? 'arrow-down' : 'arrow-up'}
              size={10}
              color={trend.dir === 'down' ? COLORS.error : COLORS.highlight}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.dir === 'down' ? COLORS.error : COLORS.highlight },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

StatPill.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accent: PropTypes.bool,
  trend: PropTypes.shape({
    dir: PropTypes.oneOf(['up', 'down']),
    value: PropTypes.string,
  }),
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  wrapAccent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelAccent: { color: 'rgba(0,0,0,0.7)' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: SPACING.sm,
  },
  value: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  valueAccent: { color: '#000' },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(0,255,161,0.1)',
    marginBottom: 4,
  },
  trendDown: { backgroundColor: 'rgba(255,92,122,0.12)' },
  trendText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
  },
});
