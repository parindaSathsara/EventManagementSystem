import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';
import Button from './Button';

export default function EmptyState({ icon = 'sparkles-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={32} color={COLORS.textMuted} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={onAction} variant="primary" style={styles.btn} />
      ) : null}
    </View>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.huge,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  title: {
    ...TYPE_SCALE.bodyLg,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: SPACING.lg,
  },
  btn: {
    paddingHorizontal: SPACING.xl,
    height: 44,
  },
});
