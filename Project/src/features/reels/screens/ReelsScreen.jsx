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
import useReels from '../hooks/useReels';
import ReelCard from '../components/ReelCard';
import ReactionPicker from '../components/ReactionPicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen({ onNavigateToEvent }) {
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
        onShare={() => {}}
        onMore={() => {}}
        onFollowPress={() => handleFollow(item.artist.id)}
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
    ],
  );

  const keyExtractor = useCallback((item) => item.id, []);

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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgStrong,
  },
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
