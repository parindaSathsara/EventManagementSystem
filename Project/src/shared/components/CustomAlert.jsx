import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII, SHADOWS } from '../../theme';
import { FONT_FAMILY } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = Math.min(SCREEN_WIDTH - SPACING.xxl * 2, 340);

const ALERT_CONFIG = {
  success: {
    icon: 'checkmark-circle',
    color: '#22C55E',
    bgTint: 'rgba(34, 197, 94, 0.12)',
    title: 'Success',
  },
  error: {
    icon: 'close-circle',
    color: COLORS.error,
    bgTint: 'rgba(255, 92, 122, 0.12)',
    title: 'Error',
  },
  info: {
    icon: 'information-circle',
    color: COLORS.info,
    bgTint: 'rgba(59, 130, 246, 0.12)',
    title: 'Info',
  },
  warning: {
    icon: 'warning',
    color: COLORS.warn,
    bgTint: 'rgba(255, 176, 32, 0.12)',
    title: 'Warning',
  },
  confirm: {
    icon: 'help-circle',
    color: COLORS.accent,
    bgTint: 'rgba(37, 99, 235, 0.12)',
    title: 'Confirm',
  },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onDismiss,
}) {
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  const config = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const displayTitle = title || config.title;
  const isConfirm = type === 'confirm';
  const primaryLabel = confirmText || (isConfirm ? 'Yes' : 'OK');
  const secondaryLabel = cancelText || 'Cancel';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 30,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayAnim, scaleAnim, translateYAnim]);

  if (!visible) return null;

  function handleConfirm() {
    if (onConfirm) onConfirm();
    if (onDismiss) onDismiss();
  }

  function handleCancel() {
    if (onCancel) onCancel();
    if (onDismiss) onDismiss();
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={isConfirm ? undefined : handleConfirm}>
        <Animated.View style={[styles.backdrop, { opacity: overlayAnim }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backdropTint} />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Alert card */}
      <Animated.View
        style={[
          styles.alertCard,
          {
            opacity: overlayAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        {/* Icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: config.bgTint }]}>
          <Ionicons name={config.icon} size={40} color={config.color} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{displayTitle}</Text>

        {/* Message */}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* Action buttons */}
        <View style={[styles.buttonRow, isConfirm && styles.buttonRowDouble]}>
          {isConfirm && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              { backgroundColor: config.color },
              isConfirm && styles.confirmButtonHalf,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

CustomAlert.propTypes = {
  visible: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning', 'confirm']),
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  onDismiss: PropTypes.func,
};

CustomAlert.defaultProps = {
  type: 'info',
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  alertCard: {
    width: ALERT_WIDTH,
    backgroundColor: COLORS.surface3,
    borderRadius: RADII.xl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.overlay,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  buttonRowDouble: {
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
  },
  confirmButtonHalf: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
});
