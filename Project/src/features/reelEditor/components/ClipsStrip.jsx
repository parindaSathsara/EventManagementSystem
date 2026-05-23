import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

function fmt(s) {
  if (s == null) return '0s';
  return `${s.toFixed(1)}s`;
}

export default function ClipsStrip({ clips, activeId, onSelect, onAdd }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Clips</Text>
        <Text style={styles.count}>
          {clips.length} clip{clips.length > 1 ? 's' : ''} ·{' '}
          {fmt(clips.reduce((s, c) => s + (c.outSec - c.inSec), 0))}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {clips.map((c, idx) => {
          const active = c.id === activeId;
          const dur = c.outSec - c.inSec;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.85}
              onPress={() => onSelect(c.id)}
              style={[styles.clip, active && styles.clipActive]}
            >
              <LinearGradient
                colors={active ? ['#FF5482', '#260b3d'] : ['#1a1a1a', '#0a0a0a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.thumb}
              >
                <Ionicons
                  name="play"
                  size={20}
                  color={active ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.4)'}
                />
              </LinearGradient>
              <View style={styles.meta}>
                <Text style={[styles.idx, active && styles.idxActive]}>#{idx + 1}</Text>
                <Text style={[styles.dur, active && styles.durActive]}>{fmt(dur)}</Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {c.label}
              </Text>
              {active ? (
                <View style={styles.activeMarker}>
                  <Ionicons name="ellipse" size={6} color={COLORS.accent} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity activeOpacity={0.85} onPress={onAdd} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.accent} />
          <Text style={styles.addText}>Add clip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

ClipsStrip.propTypes = {
  clips: PropTypes.array.isRequired,
  // Nullable: when the strip is shown with no clips, activeId may be null.
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
    paddingBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  heading: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  count: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  scroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  clip: {
    width: 78,
    paddingBottom: SPACING.xs,
    alignItems: 'center',
    borderRadius: RADII.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingTop: 4,
  },
  clipActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,84,130,0.06)',
  },
  thumb: {
    width: 60,
    height: 80,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginTop: 4,
  },
  idx: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
  },
  idxActive: { color: COLORS.accent },
  dur: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
  durActive: { color: COLORS.accent },
  label: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    maxWidth: 60,
  },
  labelActive: { color: COLORS.textPrimary },
  activeMarker: {
    position: 'absolute',
    top: -3,
    right: -3,
  },
  addBtn: {
    width: 78,
    height: 92,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,84,130,0.45)',
    backgroundColor: 'rgba(255,84,130,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
});
