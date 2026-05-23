import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY, TYPE_SCALE } from '../../../theme';
import { ConnectionError } from '../../../shared/components';
import { useReelsData } from '../../../shared/hooks';
import { reelsRepo } from '../../../services';
import { artists as artistsApi, ApiError } from '../../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = SPACING.xs;
const TILE_SIZE = (SCREEN_WIDTH - SPACING.base * 2 - GRID_GAP * 2) / 3;

function formatCount(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function ArtistProfileScreen({ artistId, onBack, onReelPress }) {
  // The artist record (followers / handle / bio / verification) comes from
  // the backend. Their reels are read from the cached feed — the API
  // returns reels with their artist embedded, so once the feed is hydrated
  // we can filter locally without another roundtrip.
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const allReels = useReelsData();

  const reels = useMemo(
    () => allReels.filter((r) => r.artist && r.artist.id === artistId),
    [allReels, artistId],
  );

  const totals = useMemo(() => {
    const views = reels.reduce((s, r) => s + (r.views || 0), 0);
    const reactions = reels.reduce((s, r) => {
      const codes = r.stats?.reactions || {};
      return s + Object.values(codes).reduce((a, b) => a + b, 0);
    }, 0);
    return { views, reactions, count: reels.length };
  }, [reels]);

  const fetchArtist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await artistsApi.getById(artistId);
      setArtist(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  if (loading && !artist) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (error && !artist) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artist</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ConnectionError error={error} onRetry={fetchArtist} />
      </View>
    );
  }

  if (!artist) return null;

  const displayName = artist.user?.name || artist.handle;
  const handle = artist.handle ? `@${artist.handle}` : '';
  const avatarUrl = artist.user?.avatarUrl;
  const bio = artist.bio || `Official page of ${displayName}`;

  function renderHeader() {
    return (
      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.textMuted} />
          </View>
        )}

        <Text style={styles.artistName}>{displayName}</Text>
        <Text style={styles.handle}>{handle}</Text>

        <Text style={styles.bio}>{bio}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totals.count}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(totals.views)}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(artist.followerCount ?? 0)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.followButton, artist.isFollowing && styles.followButtonActive]}
          activeOpacity={0.7}
          onPress={() => {
            // Optimistic — the reels repo also tracks isFollowing per cached reel.
            setArtist((a) => (a ? { ...a, isFollowing: !a.isFollowing } : a));
            reelsRepo.toggleFollow(artistId).catch(() => {
              setArtist((a) => (a ? { ...a, isFollowing: !a.isFollowing } : a));
            });
          }}
        >
          <Text style={[styles.followButtonText, artist.isFollowing && styles.followButtonTextActive]}>
            {artist.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Ionicons name="grid-outline" size={18} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>
      </View>
    );
  }

  function renderReelTile({ item, index }) {
    return (
      <TouchableOpacity
        style={styles.tile}
        activeOpacity={0.8}
        onPress={() => onReelPress && onReelPress(item, index)}
      >
        {item.videoUrl ? (
          <Video
            source={{ uri: item.videoUrl }}
            style={styles.tileCover}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
            positionMillis={1000}
          />
        ) : (
          <LinearGradient
            colors={[item.coverColor || '#0a0a0a', '#1a1a2e']}
            style={styles.tileCover}
          />
        )}
        <View style={styles.tileOverlay}>
          <Ionicons name="play" size={12} color={COLORS.textPrimary} />
          <Text style={styles.tileViews}>{formatCount(item.views || 0)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={reels}
        renderItem={renderReelTile}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

ArtistProfileScreen.propTypes = {
  artistId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onReelPress: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDefault },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgDefault,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...TYPE_SCALE.title,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: COLORS.textPrimary,
  },
  headerSpacer: { width: 40 },
  listContent: { paddingBottom: SPACING.max },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  artistName: { ...TYPE_SCALE.h3, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  handle: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginBottom: SPACING.sm },
  bio: {
    ...TYPE_SCALE.bodySm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.xxl, marginBottom: SPACING.lg },
  statItem: { alignItems: 'center' },
  statValue: { ...TYPE_SCALE.title, fontFamily: FONT_FAMILY.headingBold, color: COLORS.textPrimary },
  statLabel: { ...TYPE_SCALE.caption, fontFamily: FONT_FAMILY.body, color: COLORS.textMuted, marginTop: 2 },
  followButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    marginBottom: SPACING.xl,
  },
  followButtonActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.lineSubtle },
  followButtonText: { ...TYPE_SCALE.bodySm, fontFamily: FONT_FAMILY.bodySemiBold, color: '#000' },
  followButtonTextActive: { color: COLORS.textSecondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  sectionTitle: { ...TYPE_SCALE.bodyMd, fontFamily: FONT_FAMILY.headingSemiBold, color: COLORS.textPrimary },
  gridRow: { paddingHorizontal: SPACING.base, gap: GRID_GAP, marginBottom: GRID_GAP },
  tile: { width: TILE_SIZE, height: TILE_SIZE * 1.4, borderRadius: RADII.sm, overflow: 'hidden', backgroundColor: COLORS.surface1 },
  tileCover: { width: '100%', height: '100%' },
  tileOverlay: { position: 'absolute', bottom: SPACING.xs, left: SPACING.xs, flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileViews: { fontSize: 11, fontFamily: FONT_FAMILY.bodySemiBold, color: COLORS.textPrimary },
});
