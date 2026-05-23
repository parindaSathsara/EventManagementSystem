import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

export default function StepBar({ steps, activeIndex }) {
  return (
    <View style={styles.wrap}>
      {steps.map((label, idx) => {
        const done = idx < activeIndex;
        const active = idx === activeIndex;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  done && styles.dotDone,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#000" />
                ) : (
                  <Text
                    style={[
                      styles.dotIdx,
                      active && styles.dotIdxActive,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  done && styles.labelDone,
                ]}
              >
                {label}
              </Text>
            </View>
            {idx < steps.length - 1 ? (
              <View style={[styles.line, idx < activeIndex && styles.lineDone]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

StepBar.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeIndex: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  stepCol: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.lineStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,84,130,0.12)' },
  dotDone: { backgroundColor: COLORS.highlight, borderColor: COLORS.highlight },
  dotIdx: { fontSize: 11, fontFamily: FONT_FAMILY.bodyBold, color: COLORS.textMuted },
  dotIdxActive: { color: COLORS.accent },
  label: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
  },
  labelActive: { color: COLORS.accent, fontFamily: FONT_FAMILY.bodySemiBold },
  labelDone: { color: COLORS.highlight },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lineSubtle,
    marginBottom: 18,
  },
  lineDone: { backgroundColor: COLORS.highlight },
});
