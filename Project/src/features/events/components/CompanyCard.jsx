import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Avatar from '../../../shared/components/Avatar';
import LineupRow from './LineupRow';
import FlyerSlider from './FlyerSlider';
import EventListRow from './EventListRow';
import SocialRow from './SocialRow';

/**
 * The core of the Events page — one card per event company (organizer).
 *
 *   Company name + verified
 *   Company info (2 lines + "more")
 *   Flyer slider  (CTA → booking)
 *   Events list   (Title · Date · Time/Place)
 *   Line Up       (artists)
 *   Socials       (ig / fb / tiktok)
 */
export default function CompanyCard({
  company,
  isFollowing,
  onToggleFollow,
  onOpenEvent,
  onOpenBooking,
  onOpenArtist,
  onOpenManager,
}) {
  const { organizer, events } = company;
  const [expanded, setExpanded] = useState(false);

  const name = organizer?.user?.name || organizer?.handle || 'Event Company';
  const socials = organizer?.socials || events.find((e) => e.socials)?.socials || null;

  // Aggregate a de-duplicated lineup across this company's events (by name —
  // free-form lineup ids ('g0', 'g1') repeat across events).
  const lineup = useMemo(() => {
    const seen = new Map();
    events.forEach((e) => {
      (e.lineup || []).forEach((a) => {
        const key = (a?.name || a?.id || '').toLowerCase();
        if (a && key && !seen.has(key)) seen.set(key, a);
      });
    });
    return [...seen.values()];
  }, [events]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerMain}
          activeOpacity={0.8}
          onPress={() => onOpenManager && onOpenManager(organizer)}
        >
          <Avatar uri={organizer?.user?.avatarUrl} name={name} size={48} verified={organizer?.isVerified} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              {organizer?.isVerified ? (
                <Ionicons name="checkmark-circle" size={15} color={COLORS.accent} />
              ) : null}
            </View>
            {organizer?.category ? (
              <Text style={styles.category}>{organizer.category}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          activeOpacity={0.8}
          onPress={onToggleFollow}
        >
          <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Flyers — banner carousel leads the page (CTA to booking) */}
      <FlyerSlider events={events} onPressFlyer={onOpenBooking} />

      {/* Company info — 2 lines + more */}
      {organizer?.bio ? (
        <View style={styles.bioWrap}>
          <Text style={styles.bio} numberOfLines={expanded ? undefined : 2}>
            {organizer.bio}
          </Text>
          <TouchableOpacity onPress={() => setExpanded((x) => !x)} activeOpacity={0.7}>
            <Text style={styles.more}>{expanded ? 'less' : 'more'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Events list */}
      <View style={styles.events}>
        {events.map((e) => (
          <EventListRow key={e.id} event={e} onPress={() => onOpenEvent && onOpenEvent(e.id)} />
        ))}
      </View>

      {/* Line up */}
      {lineup.length > 0 ? (
        <View style={styles.lineupWrap}>
          <Text style={styles.sectionLabel}>Line Up</Text>
          <LineupRow lineup={lineup} onArtistPress={onOpenArtist} />
        </View>
      ) : null}

      {/* Socials */}
      {socials ? (
        <View style={styles.socialWrap}>
          <SocialRow socials={socials} />
        </View>
      ) : null}
    </View>
  );
}

CompanyCard.propTypes = {
  company: PropTypes.shape({
    organizer: PropTypes.object,
    events: PropTypes.array,
  }).isRequired,
  isFollowing: PropTypes.bool,
  onToggleFollow: PropTypes.func,
  onOpenEvent: PropTypes.func,
  onOpenBooking: PropTypes.func,
  onOpenArtist: PropTypes.func,
  onOpenManager: PropTypes.func,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface0 || COLORS.bgStrong,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  category: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  followBtnActive: {
    backgroundColor: COLORS.accent,
  },
  followText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
  followTextActive: {
    color: '#000',
  },
  bioWrap: {
    paddingHorizontal: SPACING.base,
  },
  bio: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  more: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
    marginTop: 2,
  },
  events: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  lineupWrap: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.base,
  },
  socialWrap: {
    paddingHorizontal: SPACING.base,
  },
});
