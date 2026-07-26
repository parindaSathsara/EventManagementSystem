import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ImageBackground, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SPACING } from '../../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
// Fallback height (16:9) used while the flyer's natural size loads or when
// the event has no image at all.
const FALLBACK_HEIGHT = Math.round(SCREEN_W * 9 / 16);
// Very tall flyers are capped so the page never opens on a wall of image;
// within the cap the WHOLE flyer is shown (contain), never cropped.
const MAX_HEIGHT = Math.round(SCREEN_W * 1.5);

const TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.sm;

/**
 * Event page hero — shows the uploaded flyer IN FULL (natural aspect ratio,
 * no crop) with the company/detail card rendering directly below it.
 */
export default function EventHero({ event, onBack, onShare }) {
  const banner =
    event.bannerImageUrl || event.coverImageUrl || (event.flyers && event.flyers[0]) || null;
  const [ratio, setRatio] = useState(null); // natural height / width

  useEffect(() => {
    if (!banner) return undefined;
    let alive = true;
    Image.getSize(
      banner,
      (w, h) => { if (alive && w > 0) setRatio(h / w); },
      () => { if (alive) setRatio(null); },
    );
    return () => { alive = false; };
  }, [banner]);

  const height = banner && ratio ? Math.min(Math.round(SCREEN_W * ratio), MAX_HEIGHT) : FALLBACK_HEIGHT;
  // When the cap kicks in, letterbox (contain) so the full flyer stays visible.
  const capped = banner && ratio && SCREEN_W * ratio > MAX_HEIGHT;

  return (
    <View style={[styles.heroWrap, { height }]}>
      {banner ? (
        <ImageBackground
          source={{ uri: banner }}
          style={styles.bg}
          resizeMode={capped ? 'contain' : 'cover'}
        />
      ) : event.coverImage ? (
        <ImageBackground source={event.coverImage} style={styles.bg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[event.coverColor || '#1a0a2e', '#000']} style={styles.bg} />
      )}

      {/* Subtle top scrim so the controls stay legible over the flyer. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        {/* Save/bookmark removed — auth-only feature guests can't use.
            Share is wired to the native share sheet. */}
        {onShare ? (
          <TouchableOpacity onPress={onShare} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

EventHero.propTypes = {
  event: PropTypes.object.isRequired,
  onBack: PropTypes.func,
  onShare: PropTypes.func,
};

const styles = StyleSheet.create({
  heroWrap: {
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
