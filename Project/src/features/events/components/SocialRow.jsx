import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';

const ICONS = [
  { key: 'instagram', icon: 'logo-instagram' },
  { key: 'facebook', icon: 'logo-facebook' },
  { key: 'tiktok', icon: 'logo-tiktok' },
];

/**
 * Renders Instagram / Facebook / TikTok icons for whichever links exist in
 * the `socials` blob. Tapping opens the URL. Renders nothing if no links.
 */
export default function SocialRow({ socials, size = 18, style }) {
  if (!socials) return null;
  const present = ICONS.filter((s) => socials[s.key]);
  if (present.length === 0) return null;

  function open(url) {
    if (!url) return;
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(safe).catch(() => {});
  }

  return (
    <View style={[styles.row, style]}>
      {present.map((s) => (
        <TouchableOpacity
          key={s.key}
          style={styles.btn}
          activeOpacity={0.75}
          onPress={() => open(socials[s.key])}
        >
          <Ionicons name={s.icon} size={size} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

SocialRow.propTypes = {
  socials: PropTypes.object,
  size: PropTypes.number,
  style: PropTypes.any,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
