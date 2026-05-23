import { useState } from "react";
import { authApi } from "../api/api";
import { AuthContext } from "./authContextValue";

const AUTH_STORAGE_KEY = "ticketor.auth.user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    return null;
  });

  function persistUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }

  async function login(credentials) {
    const authenticatedUser = await authApi.login(credentials);
    persistUser(authenticatedUser);
    return authenticatedUser;
  }

  async function register(data) {
    const authenticatedUser = await authApi.register(data);
    persistUser(authenticatedUser);
    return authenticatedUser;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const value = {
    ready: true,
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
