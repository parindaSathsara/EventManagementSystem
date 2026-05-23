import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY } from '../../theme';

export default function Chip({
  label,
  active = false,
  icon,
  variant = 'filter',
  onPress,
  style,
}) {
  const palette = (() => {
    if (variant === 'verified') {
      return {
        bg: 'rgba(0,255,161,0.12)',
        border: COLORS.highlight,
        text: COLORS.highlight,
      };
    }
    if (variant === 'live') {
      return {
        bg: COLORS.highlight,
        border: COLORS.highlight,
        text: '#000',
      };
    }
    if (variant === 'tag') {
      return {
        bg: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.12)',
        text: COLORS.textSecondary,
      };
    }
    if (active) {
      return {
        bg: COLORS.accent,
        border: COLORS.accent,
        text: '#000',
      };
    }
    return {
      bg: 'transparent',
      border: COLORS.lineSubtle,
      text: COLORS.textSecondary,
    };
  })();

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={palette.text}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </Wrapper>
  );
}

Chip.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(['filter', 'tag', 'verified', 'live']),
  onPress: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    // Fixed height + 0 vertical padding keeps active/inactive pixel-identical:
    // changing the bg or border colour can't reflow text baseline.
    height: 32,
    paddingVertical: 0,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    // bodySemiBold on both states — switching weight on active visually
    // resizes the chip even when the box is the same width.
    fontFamily: FONT_FAMILY.bodySemiBold,
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
