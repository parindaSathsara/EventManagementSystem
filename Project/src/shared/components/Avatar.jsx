import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS } from '../../theme';
import { FONT_FAMILY } from '../../theme';

export default function Avatar({ uri, name, size = 40, verified = false, ring = false }) {
  const initials = (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
      ) : initials ? (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={COLORS.textMuted} />
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
