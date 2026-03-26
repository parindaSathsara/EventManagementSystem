import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import PropTypes from 'prop-types';

const { width, height } = Dimensions.get('window');

const coverImage = require('../../../assets/Covers/coverSingers.png');

export default function BackgroundOverlay({ opacity = 0.15 }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={coverImage}
        style={[styles.image, { opacity }]}
        resizeMode="cover"
      />
      <View style={styles.darkOverlay} />
    </View>
  );
}

BackgroundOverlay.propTypes = {
  opacity: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    width,
    height,
    position: 'absolute',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
