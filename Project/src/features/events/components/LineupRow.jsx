import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Avatar from '../../../shared/components/Avatar';
import SocialRow from './SocialRow';

/**
 * Accepts either:
 *   - Flat shape: { id, name, avatarUrl, role, socials }     (backend / free-form)
 *   - Nested shape: { id, order, artist: { id, handle, user: {...} } }  (legacy)
 */
function normalize(entry, idx) {
  if (entry?.artist) {
    return {
      id: entry.artist.id,
      name: entry.artist.user?.name || entry.artist.handle,
      avatarUrl: entry.artist.user?.avatarUrl,
      role: idx === 0 ? 'Headliner' : 'Support',
      socials: entry.artist.socials || null,
    };
  }
  return {
    id: entry?.id,
    name: entry?.name,
    avatarUrl: entry?.avatarUrl,
    role: entry?.role || 'Support',
    socials: entry?.socials || null,
  };
}

export default function LineupRow({ lineup, onArtistPress }) {
  if (!lineup || lineup.length === 0) return null;
  const items = lineup.map(normalize);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {items.map((a) => (
        <TouchableOpacity
          key={a.id}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => onArtistPress && onArtistPress(a)}
        >
          <Avatar uri={a.avatarUrl} name={a.name} size={56} verified={a.role === 'Headliner'} />
          <Text style={styles.name} numberOfLines={1}>{a.name}</Text>
          <Text style={styles.role}>{a.role}</Text>
          {a.socials ? <SocialRow socials={a.socials} size={15} bare style={styles.social} /> : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

LineupRow.propTypes = {
  lineup: PropTypes.array,
  onArtistPress: PropTypes.func,
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  card: {
    width: 92,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  name: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    maxWidth: '100%',
  },
  role: {
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  social: {
    marginTop: SPACING.xs,
  },
});
