import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

export const FILTERS = [
  { key: 'none', label: 'Original', preview: ['#1a1a1a', '#000'] },
  { key: 'neon', label: 'Neon', preview: ['#FF5482', '#260b3d'] },
  { key: 'mono', label: 'Mono', preview: ['#fff', '#000'] },
  { key: 'sunset', label: 'Sunset', preview: ['#FFB020', '#FF5482'] },
  { key: 'forest', label: 'Forest', preview: ['#00FFA1', '#0a2a1a'] },
  { key: 'noir', label: 'Noir', preview: ['#3a3a3a', '#0a0a0a'] },
  { key: 'pop', label: 'Pop', preview: ['#FF7DA1', '#5BFFC2'] },
  { key: 'blueprint', label: 'Blueprint', preview: ['#6BA8FF', '#0d1b2a'] },
];

export default function FilterPicker({ activeKey, onSelect }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Filter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {FILTERS.map((f) => {
          const active = f.key === activeKey;
          return (
            <TouchableOpacity
              key={f.key}
              style={styles.tile}
              activeOpacity={0.85}
              onPress={() => onSelect(f.key)}
            >
              <LinearGradient
                colors={f.preview}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.preview, active && styles.previewActive]}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

FilterPicker.propTypes = {
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  wrap: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  heading: {
    paddingHorizontal: SPACING.base,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  scroll: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  tile: { width: 76, alignItems: 'center', gap: 6 },
  preview: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewActive: { borderColor: COLORS.accent },
  label: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  labelActive: { color: COLORS.textPrimary, fontFamily: FONT_FAMILY.bodySemiBold },
});
