import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { captureTokenFromUrl, getToken } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Pick up a token handed back via ?access_token=... (e.g. OAuth redirect).
      captureTokenFromUrl();

      // Public app settings are optional. If your backend exposes them at
      // GET /public-settings they'll be loaded here; otherwise we degrade
      // gracefully and continue.
      try {
        const publicSettings = await fetchPublicSettings();
        setAppPublicSettings(publicSettings);
      } catch {
        setAppPublicSettings(null);
      } finally {
        setIsLoadingPublicSettings(false);
      }

      if (getToken()) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred',
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const fetchPublicSettings = async () => {
    const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
    const res = await fetch(`${base}/public-settings`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('public settings unavailable');
    return res.json();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      // A 401/403 here just means the visitor isn't logged in — an expected state.
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      apiClient.auth.logout(window.location.href);
    } else {
      apiClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    if (window.location.pathname === "/beka/login") return;
    window.location.href = "/beka/login";
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
