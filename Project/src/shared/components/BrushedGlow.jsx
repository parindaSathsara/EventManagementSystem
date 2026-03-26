import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import PropTypes from 'prop-types';

/**
 * A soft, feathered glow rendered via SVG RadialGradient.
 * Place absolutely positioned — no hard edges.
 */
export default function BrushedGlow({ color, size, opacity, style }) {
  return (
    <View
      style={[{ width: size, height: size, position: 'absolute' }, style]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#glow)" />
      </Svg>
    </View>
  );
}

BrushedGlow.propTypes = {
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  opacity: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

BrushedGlow.defaultProps = {
  size: 300,
  opacity: 0.5,
};
