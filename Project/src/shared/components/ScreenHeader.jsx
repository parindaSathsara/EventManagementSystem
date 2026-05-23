import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightLabel,
  variant = 'default',
}) {
  const compact = variant === 'compact';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={styles.titleWrap}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {rightIcon ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onRightPress} activeOpacity={0.7}>
            <Ionicons name={rightIcon} size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : rightLabel ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onRightPress} activeOpacity={0.7}>
            <Text style={styles.actionLabel}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

ScreenHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onBack: PropTypes.func,
  rightIcon: PropTypes.string,
  onRightPress: PropTypes.func,
  rightLabel: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'compact']),
};

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

const styles = StyleSheet.create({
  wrap: {
    paddingTop: TOP,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.bgStrong,
  },
  wrapCompact: {
    paddingBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: SPACING.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
});
