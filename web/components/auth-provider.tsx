'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, getToken, readStoredUser, storeSession } from '@/lib/api';
import type { Artist, User } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  artist: Artist | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshArtist: () => Promise<Artist | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [ready, setReady] = useState(false);

  const refreshArtist = useCallback(async () => {
    if (!getToken()) { setArtist(null); return null; }
    try {
      const mine = await api.get<Artist | null>('/artists/me');
      setArtist(mine);
      return mine;
    } catch {
      setArtist(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    const fresh = await api.get<User>('/auth/me');
    setUser(fresh);
    window.localStorage.setItem('stage.web.authUser', JSON.stringify(fresh));
  }, []);

  useEffect(() => {
    const stored = readStoredUser<User>();
    if (stored && getToken()) setUser(stored);
    (async () => {
      if (getToken()) {
        try {
          const fresh = await api.get<User>('/auth/me');
          setUser(fresh);
          window.localStorage.setItem('stage.web.authUser', JSON.stringify(fresh));
          await refreshArtist();
        } catch (error) {
          if ((error as { status?: number }).status === 401) {
            clearSession();
            setUser(null);
          }
        }
      }
      setReady(true);
    })();
  }, [refreshArtist]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ user: User; token: string }>('/auth/login', { email, password }, false);
    storeSession(result.token, result.user);
    setUser(result.user);
    await refreshArtist();
    return result.user;
  }, [refreshArtist]);

  const signup = useCallback(async (data: { name: string; email: string; password: string; phone?: string }) => {
    const result = await api.post<{ user: User; token: string }>('/auth/signup', data, false);
    storeSession(result.token, result.user);
    setUser(result.user);
    setArtist(null);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setArtist(null);
  }, []);

  const value = useMemo(() => ({ user, artist, ready, login, signup, logout, refreshUser, refreshArtist }), [user, artist, ready, login, signup, logout, refreshUser, refreshArtist]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
