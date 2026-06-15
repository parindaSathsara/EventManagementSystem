import React, { useState } from 'react';
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
 * One event manager (organizer). The structure mirrors the domain:
 *   Manager → Events (banner carousel) → each Event has its own description + Line Up.
 *
 * Swiping the banner carousel selects an event; the description and line-up below
 * update to that event. The manager's socials sit in their own tagged container.
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
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const name = organizer?.user?.name || organizer?.handle || 'Event Company';
  const socials = organizer?.socials || events.find((e) => e.socials)?.socials || null;
  const selected = events[Math.min(active, events.length - 1)] || events[0];

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

      {/* Banner carousel — swipe to select an event */}
      <FlyerSlider
        events={events}
        onPressFlyer={onOpenBooking}
        onIndexChange={(i) => { setActive(i); setExpanded(false); }}
      />

      {/* Selected event — title + its own description */}
      {selected ? (
        <TouchableOpacity
          style={styles.eventBlock}
          activeOpacity={0.85}
          onPress={() => onOpenEvent && onOpenEvent(selected.id)}
        >
          <Text style={styles.eventTitle} numberOfLines={1}>{selected.title}</Text>
          {selected.description ? (
            <>
              <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>
                {selected.description}
              </Text>
              {selected.description.length > 120 ? (
                <Text style={styles.more} onPress={() => setExpanded((x) => !x)}>
                  {expanded ? 'less' : 'more'}
                </Text>
              ) : null}
            </>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {/* Selected event's Line Up */}
      {selected && selected.lineup && selected.lineup.length > 0 ? (
        <View style={styles.lineupWrap}>
          <Text style={styles.sectionLabel}>Line Up</Text>
          <LineupRow lineup={selected.lineup} onArtistPress={onOpenArtist} />
        </View>
      ) : null}

      {/* All events by this manager */}
      <View style={styles.events}>
        <Text style={styles.sectionLabel}>All events</Text>
        {events.map((e) => (
          <EventListRow key={e.id} event={e} onPress={() => onOpenEvent && onOpenEvent(e.id)} />
        ))}
      </View>

      {/* Manager socials — tagged container */}
      {socials ? (
        <View style={styles.socialCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.socialTagline}>Visit {name}</Text>
            <Text style={styles.socialSub}>Follow on social media</Text>
          </View>
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
  eventBlock: {
    paddingHorizontal: SPACING.base,
    gap: 4,
  },
  eventTitle: {
    ...TYPE_SCALE.h4,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  desc: {
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
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.base,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  socialTagline: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  socialSub: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
