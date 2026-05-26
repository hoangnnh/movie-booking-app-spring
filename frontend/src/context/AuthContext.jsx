import { useEffect, useState } from "react";
import {
  authApi,
  AUTH_STORAGE_KEY,
  getBackendBaseUrl,
  loadStoredAuth,
  persistStoredAuth,
} from "../api/api";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return loadStoredAuth()?.user || null;
  });
  const [accessToken, setAccessToken] = useState(
    () => loadStoredAuth()?.accessToken || null
  );
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function hydrateAuth() {
      const storedAuth = loadStoredAuth();

      try {
        const settings = await authApi.getSettings();
        setGoogleAuthEnabled(Boolean(settings.googleOAuthEnabled));

        if (storedAuth?.accessToken) {
          const nextUser = await authApi.getCurrentUser();
          persistAuth({
            accessToken: storedAuth.accessToken,
            user: toUserState(nextUser),
          });
        }
      } catch {
        if (storedAuth?.accessToken) {
          clearAuth();
        }
      } finally {
        setReady(true);
      }
    }

    hydrateAuth();
  }, []);

  function persistAuth(nextAuth) {
    setUser(nextAuth?.user || null);
    setAccessToken(nextAuth?.accessToken || null);
    persistStoredAuth(nextAuth);
  }

  async function login(credentials) {
    const authResponse = await authApi.login(credentials);
    const nextAuth = toAuthState(authResponse);
    persistAuth(nextAuth);
    return nextAuth.user;
  }

  async function register(data) {
    return authApi.register(data);
  }

  function loginWithGoogle() {
    if (!googleAuthEnabled) {
      throw new Error("Google login is not configured on the server.");
    }

    window.location.assign(`${getBackendBaseUrl()}/oauth2/authorization/google`);
  }

  function completeOAuthLogin(authResponse) {
    const nextAuth = toAuthState(authResponse);
    persistAuth(nextAuth);
    return nextAuth.user;
  }

  function clearAuth() {
    setUser(null);
    setAccessToken(null);
    persistStoredAuth(null);
  }

  function logout() {
    clearAuth();
  }

  const value = {
    ready,
    user,
    accessToken,
    googleAuthEnabled,
    login,
    register,
    loginWithGoogle,
    completeOAuthLogin,
    logout,
    isAuthenticated: Boolean(user),
    storageKey: AUTH_STORAGE_KEY,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function toAuthState(authResponse) {
  return {
    accessToken: authResponse.accessToken,
    user: toUserState(authResponse),
  };
}

function toUserState(authResponse) {
  return {
    userId: authResponse.userId,
    fullName: authResponse.fullName,
    email: authResponse.email,
    role: authResponse.role,
    provider: authResponse.provider,
  };
}
