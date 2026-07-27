import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS } from '../../theme';
import { FONT_FAMILY } from '../../theme';

/**
 * Fallback tints for accounts with no photo. Brand-adjacent (red → dark) so a
 * photoless avatar still reads as a deliberate badge instead of a broken
 * image — bare initials on a flat grey circle looked unfinished
 * (client feedback 2026-07-26).
 */
const FALLBACK_TINTS = [
  ['#FF3B3B', '#5E0F0F'],
  ['#FF6B6B', '#3D0B0B'],
  ['#D91E1E', '#2A0808'],
  ['#FF5252', '#4A1010'],
];

/** Stable per-name tint — the same account always gets the same colours. */
function tintFor(name) {
  const key = (name || '').trim();
  if (!key) return FALLBACK_TINTS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return FALLBACK_TINTS[hash % FALLBACK_TINTS.length];
}

/**
 * Up to two letters. Multi-word names use one letter per word ("Stage
 * Events" → "SE"); a single word uses its first two ("Wavescape" → "WA"),
 * which reads far better than a lone letter floating in the circle.
 */
function initialsFor(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function Avatar({ uri, name, size = 40, verified = false, ring = false }) {
  const initials = initialsFor(name);
  const tint = tintFor(name);

  const radius = size / 2;
  const ringSize = size + 6;
  const ringRadius = ringSize / 2;

  const inner = (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={[styles.img, { borderRadius: radius }]} />
      ) : (
        <>
          <LinearGradient
            colors={tint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          />
          <View style={[styles.fallbackEdge, { borderRadius: radius }]} />
          {initials ? (
            <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={size * 0.5} color="rgba(255,255,255,0.85)" />
          )}
        </>
      )}
      {verified ? (
        <View style={[styles.badge, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
          <Ionicons name="checkmark" size={size * 0.2} color="#000" />
        </View>
      ) : null}
    </View>
  );

  if (ring) {
    return (
      <View
        style={[
          styles.ring,
          { width: ringSize, height: ringSize, borderRadius: ringRadius },
        ]}
      >
        {inner}
      </View>
    );
  }
  return inner;
}

Avatar.propTypes = {
  uri: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  verified: PropTypes.bool,
  ring: PropTypes.bool,
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  // Hairline highlight over the gradient so the circle has a defined edge on
  // both black and surface backgrounds.
  fallbackEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  initials: {
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bgStrong,
  },
  ring: {
    padding: 2,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
