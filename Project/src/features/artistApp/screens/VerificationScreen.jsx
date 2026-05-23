import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import {
  Avatar,
  Chip,
  Button,
  ScreenHeader,
} from '../../../shared/components';
import { useUser, useAlert } from '../../../shared/hooks';

export default function VerificationScreen({ onBack }) {
  const { user, artist } = useUser();
  const alert = useAlert();
  const isApproved = !!artist?.isVerified;
  const displayName = artist?.user?.name || user?.name || 'Artist';
  const displayHandle = artist?.handle ? `@${artist.handle}` : '';
  const avatarUrl = user?.avatarUrl || artist?.user?.avatarUrl;

  let socials = {};
  try {
    socials = artist?.socialsJson ? JSON.parse(artist.socialsJson) : {};
  } catch {
    socials = {};
  }

  function handleSubmit() {
    alert.info(
      'Submit for review',
      'Document upload + admin review queue ships in the next sprint. For now, your account stays in pending status.',
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Verification" onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.heroCard}>
          <Avatar uri={avatarUrl} name={displayName} size={64} verified={isApproved} ring />
          <Text style={styles.heroName}>{displayName}</Text>
          {displayHandle ? <Text style={styles.heroHandle}>{displayHandle}</Text> : null}
          <View style={{ marginTop: SPACING.sm }}>
            {isApproved ? (
              <Chip label="Verified Artist" variant="verified" icon="shield-checkmark" />
            ) : (
              <Chip label="Pending Review" variant="filter" active icon="time-outline" />
            )}
          </View>
        </View>

        {/* Application data — sourced from the live artist + user record */}
        <Text style={styles.sectionLabel}>Application</Text>
        <View style={styles.dataCard}>
          <DataRow label="Stage name" value={displayName} />
          <DataRow label="Handle" value={displayHandle || '—'} />
          <DataRow label="City" value={user?.city || '—'} />
          <DataRow label="Instagram" value={socials.instagram || '—'} />
          <DataRow label="Spotify" value={socials.spotify || '—'} />
        </View>

        <View style={styles.helperCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.helperText}>
            Verified artists can publish reels and create events. Submit your documents to start the review.
          </Text>
        </View>

        {!isApproved ? (
          <Button
            title="Submit for review"
            variant="primary"
            onPress={handleSubmit}
            style={{ marginHorizontal: SPACING.base, marginTop: SPACING.lg }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function DataRow({ label, value }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

DataRow.propTypes = { label: PropTypes.string, value: PropTypes.string };

VerificationScreen.propTypes = { onBack: PropTypes.func };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  heroCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
  },
  heroName: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  heroHandle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  sectionLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  timeline: {
    paddingHorizontal: SPACING.base,
  },
  tlRow: { flexDirection: 'row', gap: SPACING.md },
  tlDotCol: { alignItems: 'center', width: 22 },
  tlDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.lineStrong,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlDotDone: {
    borderColor: COLORS.highlight,
    backgroundColor: COLORS.highlight,
  },
  tlDotCurrent: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  tlLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.lineSubtle,
    marginTop: 2,
  },
  tlLineDone: { backgroundColor: COLORS.highlight },
  tlLabel: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  tlLabelDone: { color: COLORS.textPrimary, fontFamily: FONT_FAMILY.headingSemiBold },
  tlAt: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  dataCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    paddingHorizontal: SPACING.md,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  dataLabel: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    width: 100,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dataValue: {
    flex: 1,
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },

  docCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  docName: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  docMeta: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  helperCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  helperText: {
    flex: 1,
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
