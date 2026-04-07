import React, { createContext, useState, useContext, useEffect } from 'react';
import { smartApi } from '@/api/apiClient';

const AuthContext = createContext(null);

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
    const token = localStorage.getItem("token");
    if (!token) {
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
      // ONLY logout if it's a confirmed session expiration
      if (error.message === "auth_required") {
        console.warn("[AUTH] Session expired, logging out...");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        setAuthError({ type: "auth_required", message: "Sesi Anda telah habis." });
      } else {
        // Just a network or server error (500, timeout, etc.)
        // Don't remove token! Let the user keep trying or see a cached version if applicable
        console.error("[AUTH] Network/Server error during auth check:", error.message);
        setAuthError({ type: "network_error", message: "Gangguan koneksi ke server." });
        // Optionally keep current local state for a bit?
      }
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    if (shouldRedirect) window.location.href = "/login";
  };

  const updateUser = (data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    const userData = data.user || data;
    setUser(prev => prev ? ({ ...prev, ...userData }) : null);
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname;
    const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/cari-masjid"];
    
    if (currentPath === "/login") return; // Arrive safely
    
    if (!publicPaths.includes(currentPath) && !currentPath.startsWith("/masjid/")) {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
