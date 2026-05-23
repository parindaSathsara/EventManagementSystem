import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

const TRACK = Dimensions.get('window').width - SPACING.base * 2 - 40;

export default function AdjustSlider({ icon, label, value, onChange, min = 0, max = 100 }) {
  const valueRef = useRef(value);
  const [, force] = useState(0);

  const panRef = useRef(null);
  if (!panRef.current) {
    panRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, g) => {
        const px = Math.max(0, Math.min(TRACK, g.moveX - SPACING.base - 40));
        const next = Math.round(min + (px / TRACK) * (max - min));
        valueRef.current = next;
        if (onChange) onChange(next);
        force((n) => n + 1);
      },
    });
  }

  const cur = valueRef.current ?? value;
  const fillPct = ((cur - min) / (max - min)) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCol}>
        <Ionicons name={icon} size={16} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{cur}</Text>
        </View>
        <View style={styles.track} {...panRef.current.panHandlers}>
          <View style={[styles.fill, { width: `${fillPct}%` }]} />
          <View style={[styles.thumb, { left: `${fillPct}%` }]} />
        </View>
      </View>
    </View>
  );
}

AdjustSlider.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  iconCol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.accent,
    minWidth: 28,
    textAlign: 'right',
  },
  track: {
    height: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: 2,
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
});
