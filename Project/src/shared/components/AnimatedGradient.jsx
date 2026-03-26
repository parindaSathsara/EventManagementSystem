import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function AnimatedGradient({ intensity = 0.4 }) {
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const layer1Opacity = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25 * intensity, 0.5 * intensity],
  });

  const layer2Opacity = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5 * intensity, 0.2 * intensity],
  });

  return (
    <>
      {/* Deep base glow */}
      <AnimatedLinearGradient
        colors={[
          '#020202',   // almost black
          '#05070C',   // deep navy
          '#0A0215',   // dark violet
          '#020202',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { opacity: layer1Opacity }]}
        pointerEvents="none"
      />

      {/* Very subtle neon hint */}
      <AnimatedLinearGradient
        colors={[
          '#020202',
          '#0F0A1F',   // dark purple
          '#120818',   // deep magenta shadow
          '#020202',
        ]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, { opacity: layer2Opacity }]}
        pointerEvents="none"
      />
    </>
  );
}

AnimatedGradient.propTypes = {
  intensity: PropTypes.number,
};

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});