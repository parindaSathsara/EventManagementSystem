import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';

export default function TicketTypeRow({ ticket, selected, onPress }) {
  const soldOut = ticket.remaining === 0;
  return (
    <TouchableOpacity
      onPress={soldOut ? undefined : onPress}
      activeOpacity={0.85}
      style={[
        styles.row,
        selected && styles.rowSelected,
        soldOut && styles.rowSoldOut,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, soldOut && styles.dim]}>{ticket.name}</Text>
        <Text style={[styles.meta, soldOut && styles.dim]}>
          {soldOut ? 'Sold out' : `${ticket.remaining} remaining`}
        </Text>
      </View>
      <Text style={[styles.price, soldOut && styles.dim]}>{ticket.priceLabel}</Text>
    </TouchableOpacity>
  );
}

TicketTypeRow.propTypes = {
  ticket: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onPress: PropTypes.func,
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
  rowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,84,130,0.08)',
  },
  rowSoldOut: {
    opacity: 0.6,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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
