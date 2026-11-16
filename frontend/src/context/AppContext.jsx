import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', text: '5 new emails classified', time: new Date().toISOString(), read: false },
    { id: 2, type: 'warning', text: '3 emails need your attention', time: new Date().toISOString(), read: false },
    { id: 3, type: 'success', text: 'AI draft ready for review', time: new Date().toISOString(), read: true },
  ]);
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
      // Use mock data if API not available
      const mockClients = [
        { _id: 'all', name: 'All Clients', company: 'Combined Inbox', email: 'all@mailpilot.ai' },
        { _id: 'james-demo', name: 'James Richardson', email: 'james.richardson@techvision.com', company: 'TechVision Inc', status: 'active' },
        { _id: 'emily-demo', name: 'Emily Chen', email: 'emily.chen@greenleaf.vc', company: 'GreenLeaf Ventures', status: 'active' },
        { _id: 'michael-demo', name: 'Michael Torres', email: 'michael@atlasconsulting.com', company: 'Atlas Consulting', status: 'active' },
      ];
      setClients(mockClients);
      setSelectedClient((prev) => prev || mockClients[0]);
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
      setEmailCounts({
        total: 30,
        unread: 12,
        assistantToReply: 10,
        clientToReply: 8,
        noReplyNeeded: 7,
        needsReview: 5,
        important: 8,
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
