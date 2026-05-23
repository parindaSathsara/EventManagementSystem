import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, RADII } from '../../../theme';

/**
 * Deterministic pseudo-QR built from a string hash.
 * Avoids pulling a QR library while still rendering a believable code for the demo.
 */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lcg(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s;
  };
}

const GRID = 21;

export default function QRPlaceholder({ value, size = 220 }) {
  const cells = useMemo(() => {
    const rng = lcg(hashSeed(value || 'qr'));
    const m = [];
    for (let r = 0; r < GRID; r++) {
      const row = [];
      for (let c = 0; c < GRID; c++) {
        row.push((rng() & 1) === 1);
      }
      m.push(row);
    }
    // Force the three position-detection patterns
    const stamp = (r0, c0) => {
      for (let dr = 0; dr < 7; dr++) {
        for (let dc = 0; dc < 7; dc++) {
          const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          m[r0 + dr][c0 + dc] = onBorder || inner;
        }
      }
      // quiet ring
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          if (dr === -1 || dr === 7 || dc === -1 || dc === 7) {
            const r = r0 + dr;
            const c = c0 + dc;
            if (r >= 0 && r < GRID && c >= 0 && c < GRID) m[r][c] = false;
          }
        }
      }
    };
    stamp(0, 0);
    stamp(0, GRID - 7);
    stamp(GRID - 7, 0);
    return m;
  }, [value]);

  const cell = size / GRID;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {cells.map((row, r) => (
        <View key={`r-${r}`} style={{ flexDirection: 'row' }}>
          {row.map((on, c) => (
            <View
              key={`c-${r}-${c}`}
              style={{
                width: cell,
                height: cell,
                backgroundColor: on ? COLORS.ink : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

QRPlaceholder.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: RADII.md,
    overflow: 'hidden',
  },
});
