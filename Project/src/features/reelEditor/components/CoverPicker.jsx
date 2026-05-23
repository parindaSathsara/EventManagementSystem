import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

const PRESETS = [
  ['#FF5482', '#260b3d'],
  ['#00FFA1', '#0a2a1a'],
  ['#FFB020', '#3d1a0b'],
  ['#6BA8FF', '#0d1b2a'],
  ['#fff', '#000'],
  ['#FF7DA1', '#5BFFC2'],
];

export default function CoverPicker({ activeIndex = 0, onSelect }) {
  const [picked, setPicked] = useState(activeIndex);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Cover frame</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {PRESETS.map((g, idx) => {
          const active = idx === picked;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.85}
              onPress={() => {
                setPicked(idx);
                if (onSelect) onSelect(idx);
              }}
              style={styles.tile}
            >
              <LinearGradient
                colors={g}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.preview, active && styles.previewActive]}
              >
                {idx === 0 ? (
                  <View style={styles.uploadOverlay}>
                    <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  </View>
                ) : null}
              </LinearGradient>
              <Text style={[styles.label, active && styles.labelActive]}>
                {idx === 0 ? 'Upload' : `Frame ${idx}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

CoverPicker.propTypes = {
  activeIndex: PropTypes.number,
  onSelect: PropTypes.func,
};

const styles = StyleSheet.create({
  wrap: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  heading: {
    paddingHorizontal: SPACING.base,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  scroll: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  tile: { width: 64, alignItems: 'center', gap: 6 },
  preview: {
    width: 60,
    height: 88,
    borderRadius: RADII.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActive: { borderColor: COLORS.accent },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  label: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  labelActive: { color: COLORS.textPrimary, fontFamily: FONT_FAMILY.bodySemiBold },
});
