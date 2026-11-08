import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Event flyer in a SQUARE frame (client feedback 2026-11-08).
 *
 * Flyers are designed as square posts, so a square flyer fills the frame
 * exactly as uploaded. When a flyer is NOT square, it is laid out at the full
 * width of the frame and its TOP is pinned to the top of the square — the
 * flyer always reads from its start:
 *
 *   portrait  → top of the flyer shown, the overflow at the bottom is clipped
 *   landscape → the whole flyer sits at the top; the space below is filled
 *               by a blurred, dimmed copy of the flyer so the frame stays full
 *
 * Size: pass `size` for an exact square, otherwise the frame takes the full
 * width of its parent at 1:1. Children are drawn above the artwork inside the
 * same clipped frame (badges, scrims, titles).
 */
export default function SquareFlyer({ uri, size, style, children }) {
  const [frameW, setFrameW] = useState(size || 0);
  const [ratio, setRatio] = useState(null); // natural height / width
  // A new flyer (e.g. re-uploaded in the creator) must be re-measured.
  useEffect(() => { setRatio(null); }, [uri]);

  const handleLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    // Guarded: onLayout can re-fire on every render on some Android versions.
    setFrameW((prev) => (Math.abs(prev - w) < 0.5 ? prev : w));
  }, []);

  const handleLoad = useCallback((e) => {
    const src = e?.nativeEvent?.source;
    if (src?.width > 0 && src?.height > 0) {
      const next = src.height / src.width;
      setRatio((prev) => (prev && Math.abs(prev - next) < 0.001 ? prev : next));
    }
  }, []);

  const frame = size ? { width: size, height: size } : styles.fullWidth;
  const measured = frameW > 0 && ratio;
  // Until both sizes are known, `cover` is a stable placeholder that fills
  // the frame without distortion; then the flyer snaps to its top-pinned box.
  const flyerStyle = measured
    ? { position: 'absolute', top: 0, left: 0, width: frameW, height: frameW * ratio }
    : styles.fill;
  const isLandscape = measured && ratio < 0.995;

  return (
    <View style={[frame, styles.frame, style]} onLayout={handleLayout}>
      {uri ? (
        <>
          {isLandscape ? (
            <>
              <Image source={{ uri }} style={styles.fill} resizeMode="cover" blurRadius={24} />
              <View style={[styles.fill, styles.dim]} />
            </>
          ) : null}
          <Image source={{ uri }} style={flyerStyle} resizeMode="cover" onLoad={handleLoad} />
        </>
      ) : null}
      {children}
    </View>
  );
}

SquareFlyer.propTypes = {
  uri: PropTypes.string,
  size: PropTypes.number,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
  children: PropTypes.node,
};

const styles = StyleSheet.create({
  fullWidth: { width: '100%', aspectRatio: 1 },
  frame: { overflow: 'hidden', backgroundColor: '#000' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  dim: { backgroundColor: 'rgba(0,0,0,0.45)' },
});
