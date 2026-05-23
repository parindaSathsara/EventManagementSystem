import React, { useEffect, useState } from 'react';
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

/**
 * Edit the caller's own artist profile.
 *
 *   - Handle (subject to uniqueness check via API)
 *   - Bio
 *   - Socials JSON blob — we present three named fields and serialise
 *     them so we don't introduce a new schema column per platform.
 *
 * Verification badge is read-only here; that workflow lives on
 * VerificationScreen.
 */
export default function EditArtistProfileScreen({ onBack }) {
  const { user, artist, refresh } = useUser();
  const alert = useAlert();

  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('DJ');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [youtube, setYoutube] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Hydrate the form from the current artist record so the user sees what
  // they already have and only diffs change on submit.
  useEffect(() => {
    if (!artist) return;
    setHandle(artist.handle || '');
    setBio(artist.bio || '');
    setCategory(artist.category || 'DJ');
    try {
      const socials = artist.socialsJson ? JSON.parse(artist.socialsJson) : {};
      setInstagram(socials.instagram || '');
      setSpotify(socials.spotify || '');
      setYoutube(socials.youtube || '');
    } catch {
      setInstagram(''); setSpotify(''); setYoutube('');
    }
  }, [artist]);

  if (!artist) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Edit profile" onBack={onBack} />
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No artist profile to edit yet.</Text>
        </View>
      </View>
    );
  }

  function validate() {
    const next = {};
    const h = handle.trim();
    if (!h) next.handle = 'Handle is required';
    else if (!/^[a-zA-Z0-9_.]{2,40}$/.test(h)) {
      next.handle = 'Letters, numbers, _ and . only (2–40 characters)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSubmitting(true);
    const socialsJson = JSON.stringify({
      instagram: instagram.trim() || undefined,
      spotify: spotify.trim() || undefined,
      youtube: youtube.trim() || undefined,
    });
    try {
      await artistsApi.updateMine({
        handle: handle.trim().toLowerCase(),
        bio: bio.trim() || undefined,
        category,
        socialsJson,
      });
      await refresh();
      alert.success('Profile saved', 'Your changes are live.', () => onBack && onBack());
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors((e) => ({ ...e, handle: 'That handle is already taken.' }));
      } else {
        alert.error('Could not save', err?.message || 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Edit profile" onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Identity */}
          <View style={styles.card}>
            <Text style={styles.cardKicker}>Public identity</Text>
            <Input
              label="Handle"
              value={handle}
              onChangeText={(t) => setHandle(t.replace(/\s/g, ''))}
              placeholder="mihiran"
              autoCapitalize="none"
              error={errors.handle}
              helper={!errors.handle ? `Fans see you as @${handle || 'your.handle'}` : undefined}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {['DJ', 'Singer', 'Band', 'Producer', 'Rapper', 'Other'].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.8}
                  style={[styles.categoryChip, category === c && styles.categoryChipActive]}
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
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Producer, DJ, live electronics."
              autoCapitalize="sentences"
            />
          </View>

          {/* Socials */}
          <View style={styles.card}>
            <Text style={styles.cardKicker}>Socials</Text>
            <View style={styles.socialRow}>
              <Ionicons name="logo-instagram" size={18} color={COLORS.accent} style={styles.socialIcon} />
              <View style={{ flex: 1 }}>
                <Input label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@yourhandle" autoCapitalize="none" />
              </View>
            </View>
            <View style={styles.socialRow}>
              <Ionicons name="musical-notes" size={18} color={COLORS.accent} style={styles.socialIcon} />
              <View style={{ flex: 1 }}>
                <Input label="Spotify" value={spotify} onChangeText={setSpotify} placeholder="Artist name" autoCapitalize="sentences" />
              </View>
            </View>
            <View style={styles.socialRow}>
              <Ionicons name="logo-youtube" size={18} color={COLORS.accent} style={styles.socialIcon} />
              <View style={{ flex: 1 }}>
                <Input label="YouTube" value={youtube} onChangeText={setYoutube} placeholder="Channel name" autoCapitalize="sentences" />
              </View>
            </View>
          </View>

          {/* Verification status — read-only */}
          <View style={styles.statusCard}>
            <Ionicons
              name={artist.isVerified ? 'shield-checkmark' : 'time-outline'}
              size={20}
              color={artist.isVerified ? COLORS.highlight : COLORS.warn}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {artist.isVerified ? 'Verified Artist' : 'Verification pending'}
              </Text>
              <Text style={styles.statusSub}>
                {artist.isVerified
                  ? 'You can publish reels and events.'
                  : 'Submit for verification from your profile to start publishing.'}
              </Text>
            </View>
          </View>

          <Button
            title="Save changes"
            onPress={handleSave}
            variant="primary"
            loading={submitting}
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

EditArtistProfileScreen.propTypes = {
  onBack: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  flex: { flex: 1 },
  scroll: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyText: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardKicker: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  socialIcon: { marginTop: 32 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  statusTitle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  statusSub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

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
});
