import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mailpilot_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user && !!token;

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('mailpilot_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.getMe();
        setUser(response.data.user || response.data);
        setToken(storedToken);
      } catch (err) {
        localStorage.removeItem('mailpilot_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.login({ email, password });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('mailpilot_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    try {
      const response = await api.register({ name, email, password, role });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('mailpilot_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mailpilot_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
