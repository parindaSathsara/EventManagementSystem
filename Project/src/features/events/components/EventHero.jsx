import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import Chip from '../../../shared/components/Chip';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 460);

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

function fmt(iso) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleString('en', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function EventHero({ event, onBack, onShare, onSave }) {
  const { weekday, day, month, time } = fmt(event.startsAt);

  return (
    <View style={styles.heroWrap}>
      {event.coverImageUrl ? (
        <ImageBackground source={{ uri: event.coverImageUrl }} style={styles.bg} />
      ) : event.coverImage ? (
        <ImageBackground source={event.coverImage} style={styles.bg} />
      ) : (
        <LinearGradient
          colors={[event.coverColor || '#1a0a2e', '#000']}
          style={styles.bg}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(5,5,5,0.95)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity onPress={onShare} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSave} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons
              name={event.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={event.isSaved ? COLORS.accent : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.tagsRow}>
          {event.status === 'live' ? (
            <Chip label="LIVE NOW" variant="live" icon="radio" />
          ) : (
            <Chip label={event.category || 'Event'} variant="filter" active />
          )}
          {event.ageRestriction ? (
            <Chip label={event.ageRestriction} variant="tag" />
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{month}</Text>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateWeekday}>{weekday}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.line}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.lineText}>{time} {event.timezone ? `· ${event.timezone}` : ''}</Text>
            </View>
            <View style={styles.line}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.lineText} numberOfLines={1}>
                {event.venueName} · {event.cityName}
              </Text>
            </View>
            {event.distanceKm != null ? (
              <View style={styles.line}>
                <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.lineText}>{event.distanceKm.toFixed(1)} km away</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

EventHero.propTypes = {
  event: PropTypes.object.isRequired,
  onBack: PropTypes.func,
  onShare: PropTypes.func,
  onSave: PropTypes.func,
};

const styles = StyleSheet.create({
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topBar: {
    position: 'absolute',
    top: TOP,
    left: SPACING.base,
    right: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  title: {
    ...TYPE_SCALE.h2,
    fontFamily: FONT_FAMILY.headingExtraBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dateBadge: {
    backgroundColor: '#fff',
    borderRadius: RADII.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    minWidth: 64,
  },
  dateMonth: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.accent,
  },
  dateDay: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.headingBold,
    color: COLORS.ink,
    marginVertical: -2,
  },
  dateWeekday: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.inkMuted,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lineText: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
});
