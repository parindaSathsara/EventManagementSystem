import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';

/**
 * Standardised error/loading state for screens that depend on a backend call.
 *
 *   <ConnectionError error={hook.error} onRetry={hook.refresh} loading={hook.loading} />
 *
 * Pass `compact` for inline placement (no full-screen padding); default is a
 * centred full-bleed message.
 */
export default function ConnectionError({
  error,
  loading,
  onRetry,
  title,
  message,
  compact = false,
}) {
  const isNetwork = !!error && (error.status === 0 || error.code === 'NETWORK');
  const fallbackTitle = isNetwork ? 'Can\'t reach the server' : 'Something went wrong';
  const fallbackMessage = isNetwork
    ? 'We couldn\'t connect to the EventSocial backend. Check your connection and try again.'
    : error?.message || 'Unexpected error. Please try again in a moment.';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.icon}>
        <Ionicons
          name={isNetwork ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={28}
          color={COLORS.accent}
        />
      </View>
      <Text style={styles.title}>{title || fallbackTitle}</Text>
      <Text style={styles.message}>{message || fallbackMessage}</Text>
      {onRetry ? (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#000" />
              <Text style={styles.retryText}>Try again</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

ConnectionError.propTypes = {
  error: PropTypes.object,
  loading: PropTypes.bool,
  onRetry: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  compact: PropTypes.bool,
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  wrapCompact: {
    flex: undefined,
    paddingVertical: SPACING.xl,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  retryText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: '#000',
  },
});
