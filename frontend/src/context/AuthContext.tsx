import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api, AuthUser, ProfilePayload, setApiToken } from "../lib/api";

const TOKEN_KEY = "fablab.auth.token";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  unreadNotifications: number;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  saveProfile: (payload: ProfilePayload) => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const token = getStoredToken();
    setApiToken(token);

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(async (response) => {
        setUser(response.user);
        const notifications = await api.getNotifications();
        setUnreadNotifications(notifications.unreadCount);
      })
      .catch(() => {
        storeToken(null);
        setApiToken(null);
        setUser(null);
        setUnreadNotifications(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email: string, password: string) {
    const response = await api.login(email, password);
    storeToken(response.token);
    setApiToken(response.token);
    setUser(response.user);
    const notifications = await api.getNotifications();
    setUnreadNotifications(notifications.unreadCount);
    return response.user;
  }

  function logout() {
    storeToken(null);
    setApiToken(null);
    setUser(null);
    setUnreadNotifications(0);
  }

  async function refreshUser() {
    const response = await api.getMe();
    setUser(response.user);
  }

  async function saveProfile(payload: ProfilePayload) {
    const response = await api.updateMyProfile(payload);
    setUser(response.user);
  }

  async function refreshNotifications() {
    if (!getStoredToken()) {
      setUnreadNotifications(0);
      return;
    }

    const notifications = await api.getNotifications();
    setUnreadNotifications(notifications.unreadCount);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      unreadNotifications,
      login,
      logout,
      refreshUser,
      saveProfile,
      refreshNotifications
    }),
    [loading, unreadNotifications, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
