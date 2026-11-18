import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('mailpilot_theme') || 'light';
  });

  // Apply theme to document element
  const applyTheme = useCallback((currentTheme) => {
    const root = document.documentElement;
    const body = document.body;
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) body.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('mailpilot_theme', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);

    // If system theme, listen to OS changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);
  const [emailCounts, setEmailCounts] = useState({
    total: 0,
    unread: 0,
    assistantToReply: 0,
    clientToReply: 0,
    noReplyNeeded: 0,
    needsReview: 0,
    important: 0,
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Fetch clients when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
    }
  }, [isAuthenticated]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.getClients();
      const clientList = response.data.clients || response.data || [];
      const userEmail = user?.email?.toLowerCase();
      
      // Auto-select the logged-in user's personal client workspace first
      const ownClient = userEmail ? clientList.find(c => c.email?.toLowerCase() === userEmail) : null;
      const allOption = { _id: 'all', name: 'All Inboxes', company: 'Combined View', email: user?.email || 'all@mailpilot.ai' };
      
      setClients([allOption, ...clientList]);
      setSelectedClient((prev) => {
        if (!prev || prev._id === 'all') {
          return ownClient || clientList[0] || allOption;
        }
        return prev;
      });
    } catch (err) {
      const allOption = { _id: 'all', name: 'All Inboxes', company: 'Combined View', email: user?.email || 'all@mailpilot.ai' };
      setClients([allOption]);
      setSelectedClient((prev) => prev || allOption);
    }
  }, [user]);

  // Fetch email counts
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmailCounts();
    }
  }, [isAuthenticated, selectedClient]);

  const fetchEmailCounts = useCallback(async () => {
    try {
      const clientId = (selectedClient?._id && selectedClient._id !== 'all') ? selectedClient._id : '';
      const response = await api.getEmailStats(clientId);
      setEmailCounts(response.data);
    } catch {
      // No dummy fallback — show zeros when API unavailable
      setEmailCounts({
        total: 0,
        unread: 0,
        assistantToReply: 0,
        clientToReply: 0,
        noReplyNeeded: 0,
        needsReview: 0,
        important: 0,
      });
    }
  }, [selectedClient]);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [
      { id: Date.now(), ...notification, time: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const value = {
    selectedClient,
    setSelectedClient,
    clients,
    fetchClients,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    addNotification,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    emailCounts,
    fetchEmailCounts,
    theme,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
