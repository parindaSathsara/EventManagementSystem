import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, G, Path } from 'react-native-svg';
import PropTypes from 'prop-types';
import BRAND from './brandPaths';

/**
 * The Stage logo, fully vector — the client's own mark (slanted bars around
 * the sound wave) and the STAGE wordmark. Path data is generated from the
 * client's master artwork by Project/scripts/build-brand-svg.py, the same
 * data the website's BrandLogo uses, so app and web can never drift apart.
 *
 *   <StageMark height={120} />           bare mark (white by default)
 *   <StageBadge size={36} />             red gradient tile + white mark (app icon look)
 *   <StageWordmark height={20} />        STAGE in outlined Sora ExtraBold
 *   <BrandLogo size={36} />              badge + wordmark lockup (headers)
 */
const { mark, wordmark, badge } = BRAND;

export function StageMark({ height, color = '#fff', style }) {
  const width = (height * mark.width) / mark.height;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${mark.width} ${mark.height}`} style={style}>
      <G fill={color}>
        {mark.paths.map((d, i) => <Path key={i} d={d} />)}
      </G>
    </Svg>
  );
}

StageMark.propTypes = {
  height: PropTypes.number.isRequired,
  color: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
};

export function StageBadge({ size, style }) {
  // Unique per instance: two badges on one screen must not share a gradient id.
  const id = `stageBadge${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const box = 100;
  const s = (box * badge.markScale) / Math.max(mark.width, mark.height);
  const tx = (box - mark.width * s) / 2;
  const ty = (box - mark.height * s) / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} style={style}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="70.7%">
          {badge.stops.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect width={box} height={box} rx={box * badge.radius} fill={`url(#${id})`} />
      <G fill="#fff" transform={`translate(${tx} ${ty}) scale(${s})`}>
        {mark.paths.map((d, i) => <Path key={i} d={d} />)}
      </G>
    </Svg>
  );
}

StageBadge.propTypes = {
  size: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
};

export function StageWordmark({ height, color = '#fff', style }) {
  const width = (height * wordmark.width) / wordmark.height;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
      style={style}
      accessibilityRole="image"
      accessibilityLabel="Stage"
    >
      <G fill={color}>
        {wordmark.paths.map((d, i) => <Path key={i} d={d} />)}
      </G>
    </Svg>
  );
}

StageWordmark.propTypes = {
  height: PropTypes.number.isRequired,
  color: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
};

/** Badge + wordmark, side by side. `size` is the badge size. */
export default function BrandLogo({ size = 36, color = '#fff', style }) {
  return (
    <View style={[styles.row, { gap: size * 0.33 }, style]}>
      <StageBadge size={size} />
      <StageWordmark height={size * 0.42} color={color} />
    </View>
  );
}

BrandLogo.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.any,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
