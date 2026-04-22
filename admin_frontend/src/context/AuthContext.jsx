/* eslint-disable react-refresh/only-export-components -- AuthProvider + useAuth pair */
import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const USER_KEY = 'farmycure_user';
const TOKEN_KEY = 'farmycure_token';
const REFRESH_TOKEN_KEY = 'farmycure_refresh_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });

  const setSession = (data) => {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken || '');
    sessionStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isAdminRole: ['admin', 'owner'].includes(user?.role),
    setSession,
    logout,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
