import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../../theme';
import { FONT_FAMILY } from '../../../theme';
import { Share } from 'react-native';
import useReels from '../hooks/useReels';
import ReelCard from '../components/ReelCard';
import ReactionPicker from '../components/ReactionPicker';
import { useAlert } from '../../../shared/hooks';
import { ConnectionError, EmptyState } from '../../../shared/components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen({ onNavigateToEvent, onNavigateToArtist, initialIndex = 0 }) {
  const {
    reels,
    activeIndex,
    setActiveIndex,
    activeTab,
    setActiveTab,
    isMuted,
    toggleMute,
    isPaused,
    togglePause,
    handleReaction,
    handleSave,
    handleRepost,
    handleFollow,
    totalReactions,
  } = useReels();

  const [reactionPickerReel, setReactionPickerReel] = useState(null);
  const flatListRef = useRef(null);
  const alert = useAlert();

  async function handleShare(reel) {
    try {
      await Share.share({
        message: `Check out ${reel.artist.name} on EventSocial: "${reel.caption}"`,
      });
    } catch (_e) {
      // user cancelled — silent
    }
  }

  function handleMore(reel) {
    alert.confirm(
      reel.artist.name,
      'What would you like to do?',
      {
        confirmText: 'Report reel',
        cancelText: 'Not interested',
        onConfirm: () => alert.success('Reported', 'Thanks — our team will review this reel.'),
        onCancel: () => alert.info('Got it', 'We\'ll show fewer reels like this.'),
      },
    );
  }

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleReactionSelect = useCallback(
    (reactionCode) => {
      if (reactionPickerReel) {
        handleReaction(reactionPickerReel.id, reactionCode);
        setReactionPickerReel(null);
      }
    },
    [reactionPickerReel, handleReaction],
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <ReelCard
        reel={item}
        isActive={index === activeIndex}
        isPaused={isPaused}
        isMuted={isMuted}
        onTapToPause={togglePause}
        onDoubleTapReaction={() => handleReaction(item.id, 'fire')}
        onReactionPress={() => setReactionPickerReel(item)}
        onRepost={() => handleRepost(item.id)}
        onSave={() => handleSave(item.id)}
        onShare={() => handleShare(item)}
        onMore={() => handleMore(item)}
        onFollowPress={() => handleFollow(item.artist.id)}
        onArtistPress={
          onNavigateToArtist
            ? () => onNavigateToArtist(item.artist.id)
            : undefined
        }
        onEventPress={
          item.linkedEvent && onNavigateToEvent
            ? () => onNavigateToEvent(item.linkedEvent.id)
            : undefined
        }
        totalReactions={totalReactions}
      />
    ),
    [
      activeIndex,
      isPaused,
      isMuted,
      togglePause,
      handleReaction,
      handleRepost,
      handleSave,
      handleFollow,
      totalReactions,
      onNavigateToEvent,
      onNavigateToArtist,
    ],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Empty + error states. The hook exposes them via array-attached properties.
  const loading = reels.loading;
  const fetchError = reels.error;
  const refresh = reels.refresh;

  if (reels.length === 0 && fetchError && !loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ConnectionError error={fetchError} onRetry={refresh} loading={loading} />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <EmptyState
          icon="film-outline"
          title={loading ? 'Loading reels…' : 'No reels yet'}
          message={loading ? 'Hang on while we pull the latest from your artists.' : 'Be the first to publish a reel — switch to the artist side and create one.'}
        />
      </View>
    );
  }

  // FlatList rejects initialScrollIndex >= data.length — clamp defensively.
  const safeInitial = Math.max(0, Math.min(initialIndex || 0, reels.length - 1));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Vertical reel feed */}
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        initialScrollIndex={safeInitial}
      />

      {/* Top header overlay */}
      <View style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          {/* Segment tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('forYou')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'forYou' && styles.tabTextActive,
                ]}
              >
                For You
              </Text>
              {activeTab === 'forYou' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('following')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'following' && styles.tabTextActive,
                ]}
              >
                Following
              </Text>
              {activeTab === 'following' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Mute toggle */}
          <TouchableOpacity
            style={styles.muteButton}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reaction picker bottom sheet */}
      <ReactionPicker
        visible={!!reactionPickerReel}
        currentReaction={reactionPickerReel?.userReaction}
        onSelect={handleReactionSelect}
        onClose={() => setReactionPickerReel(null)}
      />
    </View>
  );
}

ReelsScreen.propTypes = {
  onNavigateToEvent: PropTypes.func,
  onNavigateToArtist: PropTypes.func,
  initialIndex: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgStrong,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight + SPACING.sm,
    paddingHorizontal: SPACING.base,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.headingSemiBold,
    color: 'rgba(255, 255, 255, 0.5)',
    paddingBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 1,
    marginTop: 2,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
