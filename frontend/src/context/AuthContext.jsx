import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify user profile if tokens exist
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedRefresh = localStorage.getItem('refresh_token');

      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (err) {
        // If access token failed, try refresh once
        if (storedRefresh) {
          try {
            const refreshRes = await authService.refreshToken(storedRefresh);
            if (isMounted) {
              setAccessToken(refreshRes.access);
              localStorage.setItem('access_token', refreshRes.access);
              api.defaults.headers.common.Authorization = `Bearer ${refreshRes.access}`;
              const refreshedUserData = await authService.getCurrentUser();
              setCurrentUser(refreshedUserData);
              localStorage.setItem('user', JSON.stringify(refreshedUserData));
            }
          } catch (refErr) {
            if (isMounted) {
              authService.logout();
              setCurrentUser(null);
              setAccessToken(null);
              setRefreshToken(null);
            }
          }
        } else {
          if (isMounted) {
            authService.logout();
            setCurrentUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password);
    const { access, refresh, user } = data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    api.defaults.headers.common.Authorization = `Bearer ${access}`;
    setAccessToken(access);
    setRefreshToken(refresh);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    delete api.defaults.headers.common.Authorization;
    setCurrentUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const value = {
    currentUser,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
