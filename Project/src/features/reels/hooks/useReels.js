import { useState, useCallback, useRef } from 'react';
import MOCK_REELS from '../data/mockReels';

/**
 * Hook to manage reels feed state and interactions.
 * Replace mock data with API calls when backend is ready.
 */
export default function useReels() {
  const [reels, setReels] = useState(MOCK_REELS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('forYou');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleReaction = useCallback((reelId, reactionCode) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id !== reelId) return reel;
        const currentReaction = reel.userReaction;
        const newReaction = currentReaction === reactionCode ? null : reactionCode;
        const stats = { ...reel.stats, reactions: { ...reel.stats.reactions } };

        if (currentReaction) {
          stats.reactions[currentReaction] = Math.max(0, stats.reactions[currentReaction] - 1);
        }
        if (newReaction) {
          stats.reactions[newReaction] = (stats.reactions[newReaction] || 0) + 1;
        }

        return { ...reel, userReaction: newReaction, stats };
      }),
    );
  }, []);

  const handleSave = useCallback((reelId) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id !== reelId) return reel;
        const newSaved = !reel.isSaved;
        return {
          ...reel,
          isSaved: newSaved,
          stats: {
            ...reel.stats,
            saves: reel.stats.saves + (newSaved ? 1 : -1),
          },
        };
      }),
    );
  }, []);

  const handleRepost = useCallback((reelId) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id !== reelId) return reel;
        const newReposted = !reel.isReposted;
        return {
          ...reel,
          isReposted: newReposted,
          stats: {
            ...reel.stats,
            reposts: reel.stats.reposts + (newReposted ? 1 : -1),
          },
        };
      }),
    );
  }, []);

  const handleFollow = useCallback((artistId) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.artist.id !== artistId) return reel;
        return {
          ...reel,
          artist: { ...reel.artist, isFollowing: !reel.artist.isFollowing },
        };
      }),
    );
  }, []);

  const totalReactions = useCallback((reactions) => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  }, []);

  return {
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
  };
}
