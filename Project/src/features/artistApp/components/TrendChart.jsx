import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

export default function TrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.barsRow}>
        {data.map((d) => {
          const heightPct = (d.value / max) * 100;
          return (
            <View key={d.label} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPct}%` },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

TrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.base,
    height: 168,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});
