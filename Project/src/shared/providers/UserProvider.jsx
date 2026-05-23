import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { auth as authApi, artists as artistsApi, ApiError } from '../../services/api';

const UserContext = createContext(null);

/**
 * Provides the currently-signed-in user + their artist profile (if any)
 * to the whole tree. Replaces the old ARTIST_ME mock and the hardcoded
 * customer profile defaults.
 *
 *   const { user, artist, loading, error, refresh, logout, setUser } = useUser();
 *
 * `user` is the public auth user (id, email, name, phone, city, role, …).
 * `artist` is the linked Artist record if the user has one — null otherwise.
 *
 * The provider owns the source of truth; App.js calls `setUser()` after
 * login/signup/profile-update so the rest of the tree updates atomically.
 */
export function UserProvider({ initialUser = null, onLogout, children }) {
  const [user, setUserState] = useState(initialUser);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArtist = useCallback(async (currentUser) => {
    if (!currentUser) {
      setArtist(null);
      return null;
    }
    try {
      // GET /artists/me — returns null when the user hasn't become an artist.
      const mine = await artistsApi.me();
      setArtist(mine || null);
      return mine || null;
    } catch {
      setArtist(null);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await authApi.me();
      setUserState(fresh);
      await fetchArtist(fresh);
      return fresh;
    } catch (e) {
      setError(e);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setUserState(null);
        setArtist(null);
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchArtist]);

  const setUser = useCallback(
    async (next) => {
      setUserState(next);
      if (next) await fetchArtist(next);
      else setArtist(null);
    },
    [fetchArtist],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('[user] logout API failed; clearing local state anyway', e);
    }
    setUserState(null);
    setArtist(null);
    if (onLogout) onLogout();
  }, [onLogout]);

  // Whenever the user object changes (initialUser, login, signup), keep the
  // artist profile in sync.
  useEffect(() => {
    if (user) fetchArtist(user);
    else setArtist(null);
  }, [user, fetchArtist]);

  const value = useMemo(
    () => ({ user, artist, loading, error, refresh, setUser, logout }),
    [user, artist, loading, error, refresh, setUser, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  initialUser: PropTypes.object,
  onLogout: PropTypes.func,
  children: PropTypes.node,
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within <UserProvider>');
  }
  return ctx;
}
