import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authService from '../services/auth.service';
import { ApiError, UNAUTHORIZED_EVENT, tokenStore } from '../services/http';
import type { User } from '../types/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (payload: authService.LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-read the session from the server (e.g. after email verification). */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const current = await authService.getCurrentUser();
      setUser(current);
      setStatus('authenticated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) clearSession();
      else { setUser(null); setStatus('unauthenticated'); }
    }
  }, [clearSession]);

  // Restore the session on first load.
  useEffect(() => {
    const controller = new AbortController();
    authService.getCurrentUser(controller.signal)
      .then((current) => { setUser(current); setStatus('authenticated'); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) tokenStore.clear();
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => controller.abort();
  }, []);

  // Any 401 from an authenticated call ends the session.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  const login = useCallback(async (payload: authService.LoginPayload) => {
    const signedIn = await authService.login(payload);
    setUser(signedIn);
    setStatus('authenticated');
    return signedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
