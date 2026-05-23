import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

export default function ClipToolbar({
  onSplit,
  onMerge,
  onDelete,
  onMoveLeft,
  onMoveRight,
  canSplit,
  canMerge,
  canDelete,
  canMoveLeft,
  canMoveRight,
}) {
  return (
    <View style={styles.wrap}>
      <ToolBtn icon="cut-outline" label="Split" onPress={onSplit} disabled={!canSplit} accent />
      <ToolBtn icon="git-merge-outline" label="Merge" onPress={onMerge} disabled={!canMerge} />
      <ToolBtn icon="arrow-back" label="Move ←" onPress={onMoveLeft} disabled={!canMoveLeft} />
      <ToolBtn icon="arrow-forward" label="Move →" onPress={onMoveRight} disabled={!canMoveRight} />
      <ToolBtn icon="trash-outline" label="Delete" onPress={onDelete} disabled={!canDelete} danger />
    </View>
  );
}

function ToolBtn({ icon, label, onPress, disabled, accent, danger }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={styles.btn}
    >
      <View
        style={[
          styles.iconWrap,
          accent && !disabled && styles.iconAccent,
          danger && !disabled && styles.iconDanger,
          disabled && styles.iconDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={
            disabled
              ? COLORS.textMuted
              : accent
              ? '#000'
              : danger
              ? COLORS.error
              : COLORS.textPrimary
          }
        />
      </View>
      <Text
        style={[
          styles.label,
          disabled && { color: COLORS.textMuted },
          accent && !disabled && { color: COLORS.accent },
          danger && !disabled && { color: COLORS.error },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

ToolBtn.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
  accent: PropTypes.bool,
  danger: PropTypes.bool,
};

ClipToolbar.propTypes = {
  onSplit: PropTypes.func,
  onMerge: PropTypes.func,
  onDelete: PropTypes.func,
  onMoveLeft: PropTypes.func,
  onMoveRight: PropTypes.func,
  canSplit: PropTypes.bool,
  canMerge: PropTypes.bool,
  canDelete: PropTypes.bool,
  canMoveLeft: PropTypes.bool,
  canMoveRight: PropTypes.bool,
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    justifyContent: 'space-between',
  },
  btn: { alignItems: 'center', gap: 4, flex: 1 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAccent: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  iconDanger: {
    backgroundColor: 'rgba(255,92,122,0.1)',
    borderColor: 'rgba(255,92,122,0.4)',
  },
  iconDisabled: { opacity: 0.5 },
  label: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
});
