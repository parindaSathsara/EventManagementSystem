import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { PRICE_TBA, isPriced } from '../../../shared/utils';

/**
 * Display-only ticket category row. Ticketing happens on the organizer's
 * third-party platform, so there is no selection / quantity here — just the
 * type name and its price, like a notice board.
 *
 * A type the organizer hasn't priced yet shows "Coming soon" in the teaser
 * style — it must never be mistaken for a free ticket.
 */
export default function TicketTypeRow({ ticket }) {
  const soldOut = ticket.remaining === 0;
  const priced = isPriced(ticket);
  return (
    <View style={[styles.row, soldOut && styles.rowSoldOut]}>
      <View style={styles.iconWrap}>
        <Ionicons name={priced ? 'ticket-outline' : 'sparkles-outline'} size={16} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, soldOut && styles.dim]}>{ticket.name}</Text>
        {soldOut ? (
          <Text style={[styles.meta, styles.dim]}>Sold out</Text>
        ) : !priced ? (
          <Text style={styles.meta}>Price announced soon — stay tuned</Text>
        ) : null}
      </View>
      <Text style={[styles.price, !priced && styles.priceTba, soldOut && styles.dim]}>
        {priced ? ticket.priceLabel : PRICE_TBA}
      </Text>
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
    backgroundColor: 'rgba(255,59,59,0.14)',
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
  priceTba: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
  dim: { color: COLORS.textMuted },
});
