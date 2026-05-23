import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY } from '../../theme';

export default function BottomTabBar({ tabs, activeKey, onChange }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          const isCenter = tab.center === true;

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onChange(tab.key)}
                activeOpacity={0.85}
                style={styles.centerBtn}
              >
                <View style={styles.centerInner}>
                  <Ionicons name={tab.icon} size={24} color="#000" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.item}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? (tab.iconActive || tab.icon) : tab.icon}
                size={22}
                color={active ? COLORS.accent : COLORS.textMuted}
              />
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
              {active ? <View style={styles.activeDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

BottomTabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      icon: PropTypes.string.isRequired,
      iconActive: PropTypes.string,
      center: PropTypes.bool,
    }),
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: 'rgba(5,5,5,0.92)',
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.accent,
    fontFamily: FONT_FAMILY.bodySemiBold,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  centerBtn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  centerInner: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.highlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
