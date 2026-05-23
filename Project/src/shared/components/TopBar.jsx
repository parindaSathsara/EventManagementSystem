import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../theme';
import Avatar from './Avatar';

/**
 * Screen-level top bar: title on the left, a row of action icons on the
 * right (search, calendar, notifications, profile by default).
 *
 * The action order is fixed by the design: search → calendar (right corner),
 * then bell → profile (right corner of its own group). Pass `actions` to
 * override per-screen if a different mix is needed.
 *
 * Each action renders only if its `onPress` is provided (or `show: true`),
 * so the bar stays clean for screens that don't need every icon.
 */
export default function TopBar({
  title,
  subtitle,
  onBack,
  onSearchPress,
  onCalendarPress,
  onNotificationsPress,
  onProfilePress,
  notificationCount = 0,
  avatarUri,
  avatarName,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleWrap}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {onSearchPress ? (
            <ActionIcon icon="search-outline" onPress={onSearchPress} testID="topbar-search" />
          ) : null}
          {onCalendarPress ? (
            <ActionIcon icon="calendar-outline" onPress={onCalendarPress} testID="topbar-calendar" />
          ) : null}
          {onNotificationsPress ? (
            <View>
              <ActionIcon
                icon="notifications-outline"
                onPress={onNotificationsPress}
                testID="topbar-notifications"
              />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {notificationCount > 9 ? '9+' : String(notificationCount)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {onProfilePress ? (
            <TouchableOpacity
              onPress={onProfilePress}
              activeOpacity={0.7}
              style={styles.avatarBtn}
              testID="topbar-profile"
            >
              <Avatar uri={avatarUri} name={avatarName} size={32} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ActionIcon({ icon, onPress, testID }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.iconBtn}
      testID={testID}
    >
      <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );
}

ActionIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  testID: PropTypes.string,
};

TopBar.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onBack: PropTypes.func,
  onSearchPress: PropTypes.func,
  onCalendarPress: PropTypes.func,
  onNotificationsPress: PropTypes.func,
  onProfilePress: PropTypes.func,
  notificationCount: PropTypes.number,
  avatarUri: PropTypes.string,
  avatarName: PropTypes.string,
};

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

const styles = StyleSheet.create({
  wrap: {
    paddingTop: TOP,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.bgStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: SPACING.sm,
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPE_SCALE.caption,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    marginLeft: SPACING.xs,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bgStrong,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.bodyBold,
    color: '#000',
    letterSpacing: -0.2,
  },
});
