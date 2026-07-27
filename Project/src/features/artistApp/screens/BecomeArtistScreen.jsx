import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { Button, Input, ScreenHeader } from '../../../shared/components';
import { useUser, useAlert } from '../../../shared/hooks';
import { artists as artistsApi, ApiError } from '../../../services/api';

// Profile categories per client feedback 2026-07-09 (was DJ/Singer/Band/…).
const CATEGORIES = ['Event Company', 'Artist', 'Musician', 'Band', 'Other'];

/**
 * Customer → Stage profile upgrade flow.
 *
 * Two responsibilities:
 *   1. Collect the public-facing stage identity (handle, category, bio).
 *   2. Call POST /artists/become and refresh the global user context so the
 *      caller can immediately enter the manager tabs without a re-login.
 *
 * Verification is a separate, admin-driven step — this screen only creates
 * the profile. The owner sees a "Pending verification" badge until admin
 * approves them.
 *
 * Naming: the API/DB still calls this an "artist", but every user-facing
 * label reads "stage profile" per client feedback 2026-07-26.
 */
export default function BecomeArtistScreen({ onSuccess, onBack }) {
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('Event Company');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { user, refresh } = useUser();
  const alert = useAlert();

  function validate() {
    const next = {};
    const h = handle.trim();
    if (!h) next.handle = 'Pick a handle';
    else if (!/^[a-zA-Z0-9_.]{2,40}$/.test(h)) {
      next.handle = 'Letters, numbers, _ and . only (2–40 characters)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await artistsApi.become({
        handle: handle.trim().toLowerCase(),
        bio: bio.trim() || undefined,
        category,
      });
      // Pull the user record again so role flips to 'artist' and useUser()
      // picks up the new artist relation across the tree.
      await refresh();
      alert.success(
        'Welcome to Stage!',
        'Your stage profile is live. Submit for verification from your profile to start publishing.',
        () => onSuccess && onSuccess(),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors((e) => ({ ...e, handle: 'That handle is already taken.' }));
      } else {
        alert.error('Could not create profile', err?.message || 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Stage Profile" onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="musical-notes" size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.heroTitle}>Set up your stage profile</Text>
            <Text style={styles.heroSub}>
              Pick a public handle, tell people what you do, and start publishing reels and
              events. Verification unlocks publishing — submit from your profile once this
              is set up.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Input
              label="Public handle"
              value={handle}
              onChangeText={(t) => setHandle(t.replace(/\s/g, ''))}
              placeholder="Enter name"
              autoCapitalize="none"
              autoComplete="username"
              error={errors.handle}
              helper={!errors.handle ? 'Shown to fans as @your.handle' : undefined}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryChip,
                    category === c && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === c && styles.categoryChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Short bio (optional)"
              value={bio}
              onChangeText={setBio}
              placeholder="Enter short bio"
              autoCapitalize="sentences"
            />

            <Button
              title="Create stage profile"
              onPress={handleSubmit}
              variant="primary"
              loading={submitting}
              style={{ marginTop: SPACING.sm }}
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.noteText}>
              You'll still be able to use the customer side from the same account —
              switch between the two from your profile.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

BecomeArtistScreen.propTypes = {
  onSuccess: PropTypes.func,
  onBack: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  flex: { flex: 1 },
  scroll: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,59,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  heroSub: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.lg,
  },
  label: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    height: 32,
    justifyContent: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    backgroundColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: { color: '#000' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
