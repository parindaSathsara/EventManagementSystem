import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ScreenHeader, SectionHeader, Chip } from '../../../shared/components';

export default function CreateHubScreen({ onCreateReel, onCreateEvent, onOpenDrafts, onBack }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgStrong} translucent />
      <ScreenHeader title="Create" onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: SPACING.base, paddingTop: SPACING.sm }}>
          <Text style={styles.kicker}>What are you publishing today?</Text>

          <TouchableOpacity activeOpacity={0.92} style={styles.bigCard} onPress={onCreateReel}>
            <LinearGradient
              colors={['#FF5482', '#E63E6E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bigCardOverlay}>
              <View>
                <View style={styles.bigBadge}>
                  <Ionicons name="sparkles" size={12} color="#000" />
                  <Text style={styles.bigBadgeText}>FEATURED</Text>
                </View>
                <Text style={styles.bigTitle}>New Reel</Text>
                <Text style={styles.bigSub}>
                  Trim, color-grade, add cover & captions, then publish to your audience.
                </Text>
                <View style={styles.bigCtaRow}>
                  <View style={styles.bigCta}>
                    <Text style={styles.bigCtaText}>Open editor</Text>
                    <Ionicons name="arrow-forward" size={14} color="#000" />
                  </View>
                </View>
              </View>
              <View style={styles.bigGlyph}>
                <Ionicons name="film" size={64} color="rgba(0,0,0,0.18)" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={styles.altCard} onPress={onCreateEvent}>
            <View style={styles.altIconWrap}>
              <Ionicons name="calendar" size={22} color={COLORS.highlight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.altTitle}>New Event</Text>
              <Text style={styles.altSub}>
                Schedule a show, set the lineup, configure tickets and policies.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={styles.altCard} onPress={onOpenDrafts}>
            <View style={[styles.altIconWrap, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Ionicons name="documents-outline" size={20} color={COLORS.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.altTitle}>Continue drafts</Text>
              <Text style={styles.altSub}>You have 2 saved drafts to finish.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Tips for higher reach" kicker="WHAT'S WORKING" />
        <View style={{ paddingHorizontal: SPACING.base, gap: SPACING.sm }}>
          <Tip
            icon="time-outline"
            title="Post Friday evenings"
            text="Reels published on Friday 6-8pm get 38% more views in the first 24h."
          />
          <Tip
            icon="ticket-outline"
            title="Always link an event"
            text="Reels linked to an event drive 2.4× more ticket clicks."
          />
          <Tip
            icon="cut-outline"
            title="Keep clips under 30s"
            text="Average completion drops sharply after 30s — trim aggressively."
          />
        </View>

        <SectionHeader title="Quick filters" kicker="REUSE WHAT WORKS" />
        <View style={styles.filtersRow}>
          {['Neon', 'Mono', 'Sunset', 'Forest', 'Pop'].map((f) => (
            <Chip key={f} label={f} variant="filter" />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Tip({ icon, title, text }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <Ionicons name={icon} size={16} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipText}>{text}</Text>
      </View>
    </View>
  );
}

Tip.propTypes = { icon: PropTypes.string, title: PropTypes.string, text: PropTypes.string };

CreateHubScreen.propTypes = {
  onCreateReel: PropTypes.func,
  onCreateEvent: PropTypes.func,
  onOpenDrafts: PropTypes.func,
  onBack: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgStrong },
  kicker: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  bigCard: {
    height: 220,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  bigCardOverlay: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  bigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.highlight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    marginBottom: SPACING.sm,
  },
  bigBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
  },
  bigTitle: {
    ...TYPE_SCALE.h2,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: '#000',
  },
  bigSub: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(0,0,0,0.85)',
    maxWidth: 240,
    marginTop: 4,
  },
  bigCtaRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  bigCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    borderRadius: RADII.pill,
  },
  bigCtaText: { fontSize: 13, fontFamily: FONT_FAMILY.bodyBold, color: '#000' },
  bigGlyph: {
    alignSelf: 'flex-end',
    paddingBottom: SPACING.sm,
  },

  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    marginBottom: SPACING.sm,
  },
  altIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,255,161,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altTitle: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  altSub: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  tipIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,84,130,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  tipText: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2, lineHeight: 18 },

  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
});
