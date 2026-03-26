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

export default function LoginScreen({ onBack, onLogin, onGoToSignup, onGoToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    if (onLogin) {
      onLogin({ email: email.trim(), password });
    }
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} />

      {/* Background cover image */}
      {/* <Image source={coverImage} style={styles.coverImage} resizeMode="cover" /> */}
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
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue discovering events
            </Text>

            {/* Form card */}
            <View style={styles.formCard}>
              <View style={styles.formInner}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password}
                />

                <TouchableOpacity style={styles.forgotRow} onPress={onGoToForgotPassword}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <Button
                  title="Log In"
                  onPress={handleLogin}
                  variant="primary"
                  loading={loading}
                  style={styles.loginButton}
                />

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social login row */}
                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Ionicons name="logo-google" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Ionicons name="logo-apple" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Ionicons name="call-outline" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onGoToSignup}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
  glassCard: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
  },
  glassInner: {
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  formCard: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
  },
  formInner: {
    padding: SPACING.xl,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lineSubtle,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 18,
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
