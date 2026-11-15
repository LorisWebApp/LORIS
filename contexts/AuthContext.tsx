import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAccessToken } from '../services/api';
import { authService } from '../services/auth.service';
import type { LoginRequest, User } from '../types/user';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the app checks for an existing session on first load. */
  isLoading: boolean;
  /** Signs in and resolves with the authenticated user. Rejects with an `ApiError`. */
  login: (payload: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds the signed-in user. On first load it asks the backend (GET /auth/me) whether a session
 * already exists. If the backend is unreachable or there is no session, the person is simply
 * treated as signed out - the sign-in pages still work and show their own errors.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authService
      .me()
      .then((response) => {
        if (!cancelled) setUser(response.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    setAccessToken(response.accessToken);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, isAuthenticated: user !== null, isLoading, login, logout }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
