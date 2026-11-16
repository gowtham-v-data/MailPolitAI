import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      const allOption = { _id: 'all', name: 'All Clients', company: 'Combined Inbox', email: 'all@mailpilot.ai' };
      setClients([allOption, ...clientList]);
      // Default to "All Clients" or James Richardson for maximum visibility
      setSelectedClient((prev) => prev || allOption);
    } catch (err) {
      // No mock/dummy data — show only real connected clients
      const emptyList = [
        { _id: 'all', name: 'All Clients', company: 'Combined Inbox', email: 'all@mailpilot.ai' },
      ];
      setClients(emptyList);
      setSelectedClient((prev) => prev || emptyList[0]);
    }
  }, []);

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
