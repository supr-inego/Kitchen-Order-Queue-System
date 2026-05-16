import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authAPI } from "@/api/auth";
import { apiErrorMessage } from "@/api/client";
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "@/api/storage";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<string>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getStoredUser();
        if (!raw) return;
        const parsed = JSON.parse(raw) as User;
        setUser(parsed);
        const profile = await authAPI.getProfile();
        setUser(profile.data);
      } catch {
        await clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email.trim().toLowerCase(), password);
    await saveSession(data.access, data.refresh, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const { data } = await authAPI.register(payload);
    return data.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = await getRefreshToken();
      if (refresh) await authAPI.logout(refresh);
    } catch {
      /* ignore */
    }
    await clearSession();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await authAPI.getProfile();
    setUser(data);
    const refresh = await getRefreshToken();
    const access = (await import("@/api/storage")).getAccessToken();
    const accessToken = await access;
    if (accessToken && refresh) {
      await saveSession(accessToken, refresh, JSON.stringify(data));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, loading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { apiErrorMessage };
