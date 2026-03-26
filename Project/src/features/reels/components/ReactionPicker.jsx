import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const REACTIONS = [
  { code: 'fire', emoji: '🔥', label: 'Fire' },
  { code: 'love', emoji: '❤️', label: 'Love' },
  { code: 'handsUp', emoji: '🙌', label: 'Hype' },
  { code: 'wow', emoji: '😮', label: 'Wow' },
  { code: 'party', emoji: '🎉', label: 'Party' },
];

export default function ReactionPicker({ visible, currentReaction, onSelect, onClose }) {
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 200,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.emojiRow}>
          {REACTIONS.map((reaction) => {
            const isActive = currentReaction === reaction.code;
            return (
              <TouchableOpacity
                key={reaction.code}
                style={[styles.emojiButton, isActive && styles.emojiButtonActive]}
                onPress={() => onSelect(reaction.code)}
                activeOpacity={0.6}
              >
                <Text style={styles.emoji}>{reaction.emoji}</Text>
                <Text style={[styles.emojiLabel, isActive && styles.emojiLabelActive]}>
                  {reaction.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

ReactionPicker.propTypes = {
  visible: PropTypes.bool.isRequired,
  currentReaction: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lineSubtle,
    marginBottom: SPACING.lg,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  emojiButton: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.lg,
  },
  emojiButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emoji: {
    fontSize: 32,
  },
  emojiLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  emojiLabelActive: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.bodySemiBold,
  },
});
