/* eslint-disable react-refresh/only-export-components -- AuthProvider + useAuth pair */
import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const USER_KEY = 'farmycure_user';
const TOKEN_KEY = 'farmycure_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });

  const setSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem('farmycure_refresh_token', data.refreshToken || '');
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('farmycure_refresh_token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
