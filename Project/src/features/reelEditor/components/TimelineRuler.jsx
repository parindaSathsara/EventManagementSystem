import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - SPACING.base * 2;
const HANDLE_W = 18;

function formatTime(s) {
  const total = Math.max(0, Math.round(s * 10) / 10);
  const m = Math.floor(total / 60);
  const sec = (total - m * 60).toFixed(1);
  return `${m}:${String(sec).padStart(4, '0')}`;
}

/**
 * Visual trim bar — left/right handles drag to set inSec/outSec.
 * Pure visual layer for the demo; works on a normalized 0-1 scale.
 */
export default function TimelineRuler({ durationSec, inSec, outSec, onChange, thumbnails = [] }) {
  const inPctRef = useRef(inSec / durationSec);
  const outPctRef = useRef(outSec / durationSec);
  const [, force] = useState(0);

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const startPan = useRef({ x: 0 }).current;

  const buildHandlePan = (which) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPan.x = (which === 'in' ? inPctRef.current : outPctRef.current) * TRACK_WIDTH;
      },
      onPanResponderMove: (_e, g) => {
        const newPx = Math.max(0, Math.min(TRACK_WIDTH, startPan.x + g.dx));
        const newPct = clamp(newPx / TRACK_WIDTH);
        if (which === 'in') {
          inPctRef.current = Math.min(newPct, outPctRef.current - 0.05);
        } else {
          outPctRef.current = Math.max(newPct, inPctRef.current + 0.05);
        }
        force((n) => n + 1);
        if (onChange) {
          onChange({
            inSec: inPctRef.current * durationSec,
            outSec: outPctRef.current * durationSec,
          });
        }
      },
    });

  const inPan = useRef(buildHandlePan('in')).current;
  const outPan = useRef(buildHandlePan('out')).current;

  const inLeft = inPctRef.current * TRACK_WIDTH;
  const outLeft = outPctRef.current * TRACK_WIDTH;
  const selectedW = outLeft - inLeft;
  const selectedDur = (outPctRef.current - inPctRef.current) * durationSec;

  const FILMSTRIP_COUNT = 10;

  return (
    <View style={styles.wrap}>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>
          <Ionicons name="cut-outline" size={12} color={COLORS.accent} /> {formatTime(inPctRef.current * durationSec)}
        </Text>
        <View style={styles.durBadge}>
          <Text style={styles.durText}>{formatTime(selectedDur)} selected</Text>
        </View>
        <Text style={[styles.timeText, { textAlign: 'right' }]}>
          {formatTime(outPctRef.current * durationSec)} <Ionicons name="cut-outline" size={12} color={COLORS.accent} />
        </Text>
      </View>

      <View style={styles.track}>
        {/* Filmstrip background */}
        <View style={styles.filmstrip}>
          {Array.from({ length: FILMSTRIP_COUNT }).map((_, i) => {
            const color = thumbnails[i] || (i % 2 === 0 ? '#26212d' : '#1c1721');
            return (
              <LinearGradient
                key={i}
                colors={[color, '#0a0a0a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.frame}
              />
            );
          })}
        </View>

        {/* Selected window */}
        <View
          style={[
            styles.selected,
            { left: inLeft, width: selectedW },
          ]}
        >
          <View style={styles.selectedTop} />
          <View style={styles.selectedBottom} />
        </View>

        {/* Trimmed-out overlay - left */}
        <View style={[styles.dim, { left: 0, width: inLeft }]} />
        {/* Trimmed-out overlay - right */}
        <View style={[styles.dim, { left: outLeft, right: 0 }]} />

        {/* In handle */}
        <View
          style={[styles.handle, { left: inLeft - HANDLE_W / 2 }]}
          {...inPan.panHandlers}
        >
          <View style={styles.handleGrip} />
        </View>
        {/* Out handle */}
        <View
          style={[styles.handle, { left: outLeft - HANDLE_W / 2 }]}
          {...outPan.panHandlers}
        >
          <View style={styles.handleGrip} />
        </View>
      </View>

      <View style={styles.tickRow}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <Text key={p} style={styles.tickText}>
            {formatTime(p * durationSec)}
          </Text>
        ))}
      </View>
    </View>
  );
}

TimelineRuler.propTypes = {
  durationSec: PropTypes.number.isRequired,
  inSec: PropTypes.number.isRequired,
  outSec: PropTypes.number.isRequired,
  onChange: PropTypes.func,
  thumbnails: PropTypes.arrayOf(PropTypes.string),
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  durBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginHorizontal: SPACING.sm,
  },
  durText: { fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  track: {
    width: TRACK_WIDTH,
    height: 64,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
    position: 'relative',
  },
  filmstrip: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  frame: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.4)',
  },
  selected: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderColor: COLORS.accent,
    borderWidth: 0,
  },
  selectedTop: {
    height: 3,
    backgroundColor: COLORS.accent,
  },
  selectedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  dim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  handle: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: HANDLE_W,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGrip: {
    width: 2,
    height: 22,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  tickText: { fontSize: 9, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted },
});
