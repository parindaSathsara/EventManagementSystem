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
// Role tags ("Headliner" / "Support") are no longer shown per client
// feedback 2026-07-09 — the lineup is just names, order carries the billing.
function normalize(entry) {
  if (entry?.artist) {
    return {
      id: entry.artist.id,
      name: entry.artist.user?.name || entry.artist.handle,
      avatarUrl: entry.artist.user?.avatarUrl,
      socials: entry.artist.socials || null,
    };
  }
  return {
    id: entry?.id,
    name: entry?.name,
    avatarUrl: entry?.avatarUrl,
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
      {items.map((a, idx) => (
        <TouchableOpacity
          key={`${idx}-${a.name || a.id}`}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => onArtistPress && onArtistPress(a)}
        >
          <Avatar uri={a.avatarUrl} name={a.name} size={56} />
          <Text style={styles.name} numberOfLines={1}>{a.name}</Text>
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
  social: {
    marginTop: SPACING.xs,
  },
});
