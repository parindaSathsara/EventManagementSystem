import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

// Frame shape limits (width / height). Covers square posts, 4:5 portrait and
// 9:16 story flyers at their true shape; anything more extreme is shown
// whole inside the limit, over a blurred copy of itself.
const MIN_ASPECT = 9 / 16; // tallest frame
const MAX_ASPECT = 2; // widest frame

/**
 * Event flyer in a frame that takes the flyer's own shape, so the WHOLE
 * flyer is always visible, never cropped (client feedback 2026-11-09, flyer
 * preview in the event editor).
 *
 * Full width of its parent; the height follows the image. Until the image
 * has loaded and been measured, the frame is square. Children are drawn
 * above the artwork (upload progress, badges).
 */
export default function FitFlyer({ uri, style, children }) {
  const [aspect, setAspect] = useState(null); // natural width / height
  // A newly picked flyer must be re-measured.
  useEffect(() => { setAspect(null); }, [uri]);

  const handleLoad = useCallback((e) => {
    const src = e?.nativeEvent?.source;
    if (src?.width > 0 && src?.height > 0) {
      const next = src.width / src.height;
      setAspect((prev) => (prev && Math.abs(prev - next) < 0.001 ? prev : next));
    }
  }, []);

  const frameAspect = aspect ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect)) : 1;
  // Only an extreme flyer leaves empty space in the frame — fill it softly.
  const letterboxed = aspect != null && Math.abs(frameAspect - aspect) > 0.005;

  return (
    <View style={[styles.frame, { aspectRatio: frameAspect }, style]}>
      {uri ? (
        <>
          {letterboxed ? (
            <>
              <Image source={{ uri }} style={styles.fill} resizeMode="cover" blurRadius={24} />
              <View style={[styles.fill, styles.dim]} />
            </>
          ) : null}
          <Image source={{ uri }} style={styles.fill} resizeMode="contain" onLoad={handleLoad} />
        </>
      ) : null}
      {children}
    </View>
  );
}

FitFlyer.propTypes = {
  uri: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
  children: PropTypes.node,
};

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  dim: { backgroundColor: 'rgba(0,0,0,0.45)' },
});
