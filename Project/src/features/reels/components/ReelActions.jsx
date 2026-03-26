import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

function formatCount(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function ReelActions({
  reel,
  totalReactions,
  onReactionPress,
  onRepost,
  onSave,
  onShare,
  onMore,
}) {
  const reactionCount = totalReactions ? totalReactions(reel.stats.reactions) : 0;

  return (
    <View style={styles.container}>
      {/* Reaction */}
      <ActionButton
        icon={reel.userReaction ? 'flame' : 'flame-outline'}
        label={formatCount(reactionCount)}
        color={reel.userReaction ? '#FF6B35' : COLORS.textPrimary}
        onPress={onReactionPress}
        active={!!reel.userReaction}
      />

      {/* Repost */}
      <ActionButton
        icon={reel.isReposted ? 'repeat' : 'repeat-outline'}
        label={formatCount(reel.stats.reposts)}
        color={reel.isReposted ? COLORS.accent : COLORS.textPrimary}
        onPress={onRepost}
        active={reel.isReposted}
      />

      {/* Save */}
      <ActionButton
        icon={reel.isSaved ? 'bookmark' : 'bookmark-outline'}
        label={formatCount(reel.stats.saves)}
        color={reel.isSaved ? COLORS.warn : COLORS.textPrimary}
        onPress={onSave}
        active={reel.isSaved}
      />

      {/* Share */}
      <ActionButton
        icon="paper-plane-outline"
        label={formatCount(reel.stats.shares)}
        color={COLORS.textPrimary}
        onPress={onShare}
      />

      {/* More menu */}
      <ActionButton
        icon="ellipsis-horizontal"
        color={COLORS.textPrimary}
        onPress={onMore}
        small
      />
    </View>
  );
}

function ActionButton({ icon, label, color, onPress, active, small }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, small && styles.actionButtonSmall]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons name={icon} size={small ? 22 : 26} color={color} />
      </View>
      {label ? <Text style={[styles.actionLabel, { color }]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

ActionButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string,
  color: PropTypes.string,
  onPress: PropTypes.func,
  active: PropTypes.bool,
  small: PropTypes.bool,
};

ReelActions.propTypes = {
  reel: PropTypes.object.isRequired,
  totalReactions: PropTypes.func,
  onReactionPress: PropTypes.func,
  onRepost: PropTypes.func,
  onSave: PropTypes.func,
  onShare: PropTypes.func,
  onMore: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButtonSmall: {
    marginTop: SPACING.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
