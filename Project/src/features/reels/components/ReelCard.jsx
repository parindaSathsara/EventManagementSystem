import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../../theme';
import ReelOverlay from './ReelOverlay';
import ReelActions from './ReelActions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A single full-screen reel card.
 * Uses cover image as placeholder until video playback is integrated.
 */
export default function ReelCard({
  reel,
  isActive,
  isPaused,
  isMuted,
  onTapToPause,
  onDoubleTapReaction,
  onReactionPress,
  onRepost,
  onSave,
  onShare,
  onMore,
  onFollowPress,
  onEventPress,
  totalReactions,
}) {
  const pauseOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0) {
          handleSingleTap();
        }
      }, 300);
    }
  }

  function handleSingleTap() {
    if (onTapToPause) onTapToPause();
    Animated.sequence([
      Animated.timing(pauseOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(pauseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handleDoubleTap() {
    if (onDoubleTapReaction) onDoubleTapReaction();
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <View style={styles.container}>
      {/* Background — gradient placeholder for video */}
      <LinearGradient
        colors={[reel.coverColor || '#0a0a0a', '#000000', reel.coverColor || '#0a0a0a']}
        locations={[0, 0.5, 1]}
        style={styles.background}
      />

      {/* Video placeholder visual — abstract pattern */}
      <View style={styles.visualContainer}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.08)', 'transparent', 'rgba(255, 43, 214, 0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playIconWrap}>
          <Ionicons name="play" size={48} color="rgba(255,255,255,0.15)" />
        </View>
      </View>

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.touchArea}>
          {/* Bottom overlay — artist info, caption, music, event */}
          <ReelOverlay
            reel={reel}
            onFollowPress={onFollowPress}
            onEventPress={onEventPress}
          />

          {/* Right action rail */}
          <View style={styles.actionsContainer}>
            <ReelActions
              reel={reel}
              totalReactions={totalReactions}
              onReactionPress={onReactionPress}
              onRepost={onRepost}
              onSave={onSave}
              onShare={onShare}
              onMore={onMore}
            />
          </View>

          {/* Pause indicator */}
          <Animated.View
            style={[styles.pauseIndicator, { opacity: pauseOpacity }]}
            pointerEvents="none"
          >
            <View style={styles.pauseCircle}>
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={40}
                color={COLORS.textPrimary}
              />
            </View>
          </Animated.View>

          {/* Double-tap heart */}
          <Animated.View
            style={[
              styles.heartIndicator,
              {
                opacity: heartScale,
                transform: [{ scale: heartScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="flame" size={80} color="#FF6B35" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

ReelCard.propTypes = {
  reel: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  isPaused: PropTypes.bool,
  isMuted: PropTypes.bool,
  onTapToPause: PropTypes.func,
  onDoubleTapReaction: PropTypes.func,
  onReactionPress: PropTypes.func,
  onRepost: PropTypes.func,
  onSave: PropTypes.func,
  onShare: PropTypes.func,
  onMore: PropTypes.func,
  onFollowPress: PropTypes.func,
  onEventPress: PropTypes.func,
  totalReactions: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.bgStrong,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  visualContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchArea: {
    flex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.huge + SPACING.xxl,
    alignItems: 'center',
  },
  pauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
