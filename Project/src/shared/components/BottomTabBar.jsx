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
              <View>
                <Ionicons
                  name={active ? (tab.iconActive || tab.icon) : tab.icon}
                  size={22}
                  color={active ? COLORS.accent : COLORS.textMuted}
                />
                {/* Unseen badge — count bubble (or dot) on the icon corner. */}
                {tab.badge ? (
                  <View style={styles.badge}>
                    {typeof tab.badge === 'number' ? (
                      <Text style={styles.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
              {/* Active state = color highlight only; the old dot above the
                  icon lingered visually and was removed per client feedback. */}
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
      badge: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
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
