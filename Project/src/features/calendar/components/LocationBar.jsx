import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

export default function LocationBar({
  location,
  radiusKm,
  nearMeOn,
  onToggleNearMe,
  onChangeLocation,
  onChangeRadius,
}) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.locRow} onPress={onChangeLocation} activeOpacity={0.7}>
        <View style={styles.iconBubble}>
          <Ionicons name="location" size={14} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.locLabel}>Location</Text>
          <Text style={styles.locValue} numberOfLines={1}>{location}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Near me</Text>
          <Text style={styles.toggleSub}>Show events within {radiusKm} km</Text>
        </View>
        <Switch
          value={nearMeOn}
          onValueChange={onToggleNearMe}
          trackColor={{ false: COLORS.surface3, true: COLORS.accent }}
          thumbColor="#fff"
        />
      </View>

      {nearMeOn ? (
        <View style={styles.radiusRow}>
          {[2, 5, 10, 25, 50].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => onChangeRadius(r)}
              activeOpacity={0.7}
              style={[styles.rChip, radiusKm === r && styles.rChipActive]}
            >
              <Text style={[styles.rChipText, radiusKm === r && styles.rChipTextActive]}>
                {r}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

LocationBar.propTypes = {
  location: PropTypes.string.isRequired,
  radiusKm: PropTypes.number.isRequired,
  nearMeOn: PropTypes.bool.isRequired,
  onToggleNearMe: PropTypes.func.isRequired,
  onChangeLocation: PropTypes.func,
  onChangeRadius: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    overflow: 'hidden',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locValue: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lineSubtle,
    marginHorizontal: SPACING.base,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  toggleLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  toggleSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  rChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: 'transparent',
  },
  rChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  rChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textSecondary,
  },
  rChipTextActive: { color: '#000' },
});
