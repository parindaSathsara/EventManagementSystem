import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';

export default function SectionHeader({ title, action, onActionPress, kicker }) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.string,
  onActionPress: PropTypes.func,
  kicker: PropTypes.string,
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  kicker: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    ...TYPE_SCALE.h3,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  action: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.accent,
  },
});
