import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';
import { Button, Input } from '../../../shared/components';

const { width, height } = Dimensions.get('window');
const coverImage = require('../../../../assets/Covers/coverLow.png');

export default function ForgotPasswordScreen({ onBack, onResetPassword }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleReset() {
    if (!validate()) return;
    setLoading(true);
    if (onResetPassword) {
      onResetPassword({ email: email.trim() });
    }
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />

      {/* <Image `source={coverImage} style={styles.coverImage} resizeMode="cover" /> */}
      <View style={styles.coverOverlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Back button */}
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {/* Heading */}
            <Text style={styles.heading}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>

            {/* Form card */}
            <View style={styles.formCard}>
              <View style={styles.formInner}>
                {sent ? (
                  <View style={styles.sentContainer}>
                    <View style={styles.sentIconWrapper}>
                      <Ionicons name="mail-outline" size={40} color={COLORS.accent} />
                    </View>
                    <Text style={styles.sentTitle}>Check your email</Text>
                    <Text style={styles.sentText}>
                      We've sent a password reset link to{'\n'}
                      <Text style={styles.sentEmail}>{email.trim()}</Text>
                    </Text>
                    <Button
                      title="Back to Login"
                      onPress={onBack}
                      variant="primary"
                      style={styles.resetButton}
                    />
                  </View>
                ) : (
                  <>
                    <Input
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email}
                    />

                    <Button
                      title="Send Reset Link"
                      onPress={handleReset}
                      variant="primary"
                      loading={loading}
                      style={styles.resetButton}
                    />
                  </>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgStrong,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
    opacity: 0.2,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.huge,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
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
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  formCard: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
  },
  formInner: {
    padding: SPACING.xl,
  },
  resetButton: {
    marginTop: SPACING.sm,
  },
  sentContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  sentIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  sentTitle: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sentText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  sentEmail: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
});
