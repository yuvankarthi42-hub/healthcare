import { createContext, useContext, useState, useCallback } from "react";
import api, { setSession, clearSession, getStoredUser } from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());

  const login = useCallback(async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    setSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = (import.meta.env.BASE_URL || "/").replace(/\/{2,}/g, "/");
  }, []);

  return <AuthContext.Provider value={{ user, loading: false, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
