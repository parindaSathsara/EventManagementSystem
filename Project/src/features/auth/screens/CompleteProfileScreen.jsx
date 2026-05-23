import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Button, Input } from '../../../shared/components';

/**
 * Shown once, after a user's first successful login, when their profile is
 * missing required contact info. Currently captures phone (+ optional city).
 *
 * Skipping is allowed but the user will be prompted again next launch.
 */
export default function CompleteProfileScreen({
  user,
  onSubmit,
  onSkip,
}) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    const trimmed = phone.trim();
    if (!trimmed) {
      next.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s\-()]{7,20}$/.test(trimmed)) {
      next.phone = 'Enter a valid phone number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await Promise.resolve(
        onSubmit && onSubmit({ phone: phone.trim(), city: city.trim() }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />
      <View style={styles.coverOverlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="call-outline" size={28} color={COLORS.accent} />
          </View>

          <Text style={styles.heading}>
            One last thing{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </Text>
          <Text style={styles.subtitle}>
            Add your phone number so artists and ticket support can reach you about
            your bookings.
          </Text>

          <View style={styles.formCard}>
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+94 77 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
            />

            <Input
              label="City (optional)"
              value={city}
              onChangeText={setCity}
              placeholder="Colombo"
              autoCapitalize="words"
            />

            <Button
              title="Continue"
              onPress={handleSubmit}
              variant="primary"
              loading={submitting}
              style={styles.cta}
            />

            {onSkip ? (
              <TouchableOpacity onPress={onSkip} style={styles.skip}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.note}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.noteText}>
              We never share your number. Used only for ticket SMS and account
              recovery.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

CompleteProfileScreen.propTypes = {
  user: PropTypes.object,
  onSubmit: PropTypes.func,
  onSkip: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.huge + SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heading: {
    fontSize: 28,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  formCard: {
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surface1,
    padding: SPACING.xl,
  },
  cta: { marginTop: SPACING.sm },
  skip: {
    alignSelf: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  skipText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  noteText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
