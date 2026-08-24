import React, { useCallback, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

/**
 * A cover image anchored to the TOP of its frame instead of the centre.
 *
 * React Native's `resizeMode="cover"` centres the crop. On event flyers —
 * which are overwhelmingly portrait, with the artist's face in the upper
 * third — a short landscape card frame then trims equally off the top and the
 * bottom, and the faces go with it.
 *
 * RN core has no `objectPosition`, so we measure instead. Once we know the
 * frame's size (onLayout) and the image's intrinsic size (onLoad), the image
 * can be laid out at its OWN aspect ratio, pinned to the top, and the frame
 * clips whatever hangs off the bottom.
 *
 * The image is never stretched — it keeps its ratio in both branches:
 *
 *   taller than the frame → natural ratio, pinned to the top, bottom cropped
 *   wider than the frame  → plain `cover`, which crops the sides. Horizontal
 *                           centring is the right call there; it's vertical
 *                           centring that decapitates people.
 */
export default function TopCropImage({ uri, source, style, imageStyle, children, ...rest }) {
  const [frame, setFrame] = useState(null);
  const [natural, setNatural] = useState(null);

  const handleLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    // Guard the setState: onLayout fires on every re-render on some Android
    // versions, and an unconditional update would loop.
    setFrame((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const handleLoad = useCallback((e) => {
    const src = e?.nativeEvent?.source;
    if (src?.width > 0 && src?.height > 0) {
      setNatural((prev) =>
        prev && prev.width === src.width && prev.height === src.height
          ? prev
          : { width: src.width, height: src.height },
      );
    }
  }, []);

  const resolved = source || (uri ? { uri } : null);
  // Still render the frame when there's no image — callers layer overlays
  // inside it, and those must not vanish with the artwork.
  if (!resolved) {
    return children ? <View style={[style, styles.clip]}>{children}</View> : null;
  }

  // Until both measurements land, `cover` is the right placeholder: it fills
  // the frame without distortion, so switching to the top-pinned layout is a
  // re-crop, not a re-flow — nothing around it moves.
  let computed = null;
  if (frame?.width > 0 && frame?.height > 0 && natural?.width > 0) {
    const scaledHeight = (frame.width * natural.height) / natural.width;
    // Only pin to the top when there is actually an overflow to push downward.
    if (scaledHeight > frame.height + 0.5) {
      computed = { width: frame.width, height: scaledHeight };
    }
  }

  return (
    // overflow: hidden is load-bearing — without it the overflowing bottom of
    // a tall flyer paints straight over the card's title and meta rows.
    <View style={[style, styles.clip]} onLayout={handleLayout}>
      <Image
        {...rest}
        source={resolved}
        onLoad={handleLoad}
        // With an exact-ratio box `cover` is a no-op; it stays as insurance
        // against sub-pixel rounding on the computed height.
        resizeMode="cover"
        style={[computed ? { ...styles.pinnedTop, ...computed } : styles.fill, imageStyle]}
      />
      {/* Overlays (gradients, badges, titles) sit above the artwork and are
          clipped by the same frame. */}
      {children}
    </View>
  );
}

TopCropImage.propTypes = {
  /** Remote image URL. Ignored when `source` is given. */
  uri: PropTypes.string,
  /** A full RN image source (local `require`, or `{ uri }`). */
  // eslint-disable-next-line react/forbid-prop-types
  source: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  imageStyle: PropTypes.any,
  /** Overlays drawn above the image, inside the same clipped frame. */
  children: PropTypes.node,
};

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  // Absolute in BOTH branches, not just the pinned one. Callers layer in-flow
  // overlays inside this frame and lean on its flexbox to place them (the
  // Timeline poster bottom-aligns its title with `justifyContent: 'flex-end'`).
  // A full-height in-flow image would fight those children for the column.
  fill: { ...StyleSheet.absoluteFillObject },
  pinnedTop: { position: 'absolute', top: 0, left: 0 },
});
