import React, { createContext, useState, useContext, useEffect } from 'react';
import { smartApi } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    // Cek apakah ada token di localStorage sebelum request ke server
    const token = localStorage.getItem("token");
    if (!token) {
      // Tidak ada token = belum login, ini BUKAN error
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({ type: "auth_required", message: "Please login" });
      return;
    }

    try {
      const currentUser = await smartApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      // Token ada tapi tidak valid / expired
      localStorage.removeItem("token");
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({ type: "auth_required", message: "Session expired, please login again" });
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname;
    const isAlreadyOnLogin = currentPath === "/login" || currentPath === "/";
    if (!isAlreadyOnLogin) {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
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
