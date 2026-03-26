import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';

export default function ReelOverlay({ reel, onFollowPress, onEventPress }) {
  const { artist, caption, musicTrack, linkedEvent, tags } = reel;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Gradient fade from bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.3, 1]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        {/* Artist row */}
        <View style={styles.artistRow}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={COLORS.textMuted} />
          </View>
          <Text style={styles.artistName}>{artist.name}</Text>
          {!artist.isFollowing && (
            <TouchableOpacity style={styles.followBadge} onPress={onFollowPress} activeOpacity={0.7}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        )}

        {/* Music track */}
        {musicTrack && (
          <View style={styles.musicRow}>
            <Ionicons name="musical-notes" size={14} color={COLORS.textPrimary} />
            <Text style={styles.musicText} numberOfLines={1}>
              {musicTrack.title} — {musicTrack.artistName}
            </Text>
          </View>
        )}

        {/* Linked event */}
        {linkedEvent && (
          <TouchableOpacity style={styles.eventTag} onPress={onEventPress} activeOpacity={0.7}>
            <Ionicons name="ticket-outline" size={14} color={COLORS.accent} />
            <Text style={styles.eventText} numberOfLines={1}>
              {linkedEvent.title}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

ReelOverlay.propTypes = {
  reel: PropTypes.object.isRequired,
  onFollowPress: PropTypes.func,
  onEventPress: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    paddingBottom: SPACING.huge,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.max,
    gap: SPACING.sm,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  followBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  followText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
  caption: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.highlight,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  musicText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.pill,
    alignSelf: 'flex-start',
  },
  eventText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
    maxWidth: 180,
  },
});
