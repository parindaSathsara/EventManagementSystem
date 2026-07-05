import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

/**
 * Display-only ticket category row. Ticketing happens on the organizer's
 * third-party platform, so there is no selection / quantity here — just the
 * type name and its price, like a notice board.
 */
export default function TicketTypeRow({ ticket }) {
  const soldOut = ticket.remaining === 0;
  return (
    <View style={[styles.row, soldOut && styles.rowSoldOut]}>
      <View style={styles.iconWrap}>
        <Ionicons name="ticket-outline" size={16} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, soldOut && styles.dim]}>{ticket.name}</Text>
        {soldOut ? <Text style={[styles.meta, styles.dim]}>Sold out</Text> : null}
      </View>
      <Text style={[styles.price, soldOut && styles.dim]}>{ticket.priceLabel}</Text>
    </View>
  );
}

TicketTypeRow.propTypes = {
  ticket: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface1,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  rowSoldOut: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(124,92,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  meta: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  price: {
    ...TYPE_SCALE.bodyMd,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.highlight,
  },
  dim: { color: COLORS.textMuted },
});
