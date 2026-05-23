import { useState, useCallback } from 'react';
import { useReelsData } from '../../../shared/hooks';
import { reelsRepo } from '../../../services';

/**
 * Reels feed state. Persistent data (the list, reactions, saves, follows) is
 * stored via reelsRepo. Session UI state (active index, mute, pause) stays local.
 */
export default function useReels() {
  const reels = useReelsData();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('forYou');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const handleReaction = useCallback((reelId, code) => {
    reelsRepo.reactTo(reelId, code);
  }, []);
  const handleSave = useCallback((reelId) => { reelsRepo.toggleSave(reelId); }, []);
  const handleRepost = useCallback((reelId) => { reelsRepo.toggleRepost(reelId); }, []);
  const handleFollow = useCallback((artistId) => { reelsRepo.toggleFollow(artistId); }, []);

  const totalReactions = useCallback((reactions) => {
    return Object.values(reactions || {}).reduce((sum, count) => sum + count, 0);
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
