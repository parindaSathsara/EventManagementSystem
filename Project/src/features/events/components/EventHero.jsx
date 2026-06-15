import React from 'react';
import { View, StyleSheet, ImageBackground, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
// One full-width landscape (16:9) banner that covers the top of the page.
const HERO_HEIGHT = Math.round(SCREEN_W * 9 / 16);

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

export default function EventHero({ event, onBack, onShare, onSave }) {
  const banner =
    event.bannerImageUrl || event.coverImageUrl || (event.flyers && event.flyers[0]) || null;

  return (
    <View style={styles.heroWrap}>
      {banner ? (
        <ImageBackground source={{ uri: banner }} style={styles.bg} resizeMode="cover" />
      ) : event.coverImage ? (
        <ImageBackground source={event.coverImage} style={styles.bg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={styles.bg} />
      )}

      {/* Subtle top + bottom scrims so the controls stay legible. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(5,5,5,0.9)']}
        locations={[0, 0.4, 1]}
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
    width: '100%',
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
});
