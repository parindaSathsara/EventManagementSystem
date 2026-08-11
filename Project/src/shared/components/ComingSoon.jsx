import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';

/**
 * "Revealed soon" placeholder — the friendly face of an event detail the
 * organizer hasn't published yet (lineup, venue, ticket prices).
 *
 * Never reads as an error or an empty state: a dashed accent card with a
 * sparkle, a promise and a "stay tuned" nudge, so guests keep coming back to
 * the event page for the reveal.
 *
 *   variant="card"    full-width dashed card (event page sections)
 *   variant="inline"  compact pill row (Timeline card, tight spaces)
 */
export default function ComingSoon({
  title,
  message,
  icon = 'sparkles',
  variant = 'card',
  style,
}) {
  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]}>
        <Ionicons name={icon} size={13} color={COLORS.accent} />
        <Text style={styles.inlineText} numberOfLines={1}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

ComingSoon.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(['card', 'inline']),
  style: PropTypes.any,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,59,59,0.45)',
    backgroundColor: 'rgba(255,59,59,0.06)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,59,59,0.14)',
  },
  title: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  message: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,59,59,0.45)',
    backgroundColor: 'rgba(255,59,59,0.08)',
  },
  inlineText: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
    flexShrink: 1,
  },
});
