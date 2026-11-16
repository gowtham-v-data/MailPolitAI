import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import * as api from '../api';
import { stringToColor, getInitials } from '../utils/helpers';
import {
  User, Mail, Bell, RefreshCw, Sliders, Sparkles,
  Database, Calendar, Key, ExternalLink, Zap,
  Sun, Moon, Monitor, Palette, Check, Trash2
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { selectedClient, fetchEmailCounts, fetchClients, theme, setTheme } = useApp();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('appearance');
  const [aiSettings, setAiSettings] = useState({ autoClassify: true, confidenceThreshold: 75 });
  const [notifications, setNotifications] = useState({
    email: true,
    classification: true,
    delegation: true,
    digest: false
  });
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [savingKey, setSavingKey] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customProvider, setCustomProvider] = useState('gmail');
  const [connectingCustom, setConnectingCustom] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    fetchIntegrations();

    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'google_success') {
      toast.success(`Google Account connected: ${params.get('email') || 'authorized'} ✓`);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchIntegrations();
      if (fetchClients) fetchClients();
      if (fetchEmailCounts) fetchEmailCounts();
    } else if (params.get('oauth') === 'error') {
      toast.error(`Google OAuth error: ${params.get('message') || 'authorization failed'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [selectedClient]);

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    try {
      const clientId = (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : undefined;
      const res = await api.getIntegrationsStatus(clientId);
      if (res.data?.integrations) {
        setIntegrations(res.data.integrations);
      }
    } catch (err) {
      console.warn('Could not load integrations:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleSyncProvider = async (providerId) => {
    setSyncingProvider(providerId);
    try {
      const clientId = (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : undefined;
      const res = await api.syncIntegrationProvider(providerId, clientId);
      toast.success(res.data?.message || `${providerId} synchronized`);
      fetchIntegrations();
      if (fetchEmailCounts) fetchEmailCounts();
    } catch {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      await api.updateAIConfig({ apiKey: geminiKeyInput, model: geminiModel });
      toast.success('Gemini configuration saved');
      setGeminiKeyInput('');
      fetchIntegrations();
    } catch {
      toast.error('Failed to update Gemini settings');
    } finally {
      setSavingKey(false);
    }
  };

  const handleConnectCustomAccount = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setConnectingCustom(true);
    try {
      await api.connectAccount({
        email: customEmail.trim(),
        displayName: customName.trim() || customEmail.split('@')[0],
        provider: customProvider,
        clientId: (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : undefined
      });
      toast.success(`Connected: ${customEmail}`);
      setCustomEmail('');
      setCustomName('');
      fetchIntegrations();
      if (fetchClients) fetchClients();
      if (fetchEmailCounts) fetchEmailCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect email');
    } finally {
      setConnectingCustom(false);
    }
  };

  const handlePurgeDummyData = async () => {
    if (!window.confirm('Wipe simulated emails to run in 100% Real Data mode?')) return;
    setPurging(true);
    try {
      const res = await api.purgeDummyData();
      toast.success(res.data?.message || 'Operating in Real Data mode');
      fetchIntegrations();
      if (fetchClients) fetchClients();
      if (fetchEmailCounts) fetchEmailCounts();
    } catch {
      toast.error('Failed to wipe simulated data');
    } finally {
      setPurging(false);
    }
  };

  const avatarColor = stringToColor(user?.name || '');

  const tabs = [
    { id: 'appearance', label: 'Appearance & Profile', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'ai', label: 'AI Engine', icon: Sparkles },
    { id: 'accounts', label: 'Connected Inboxes', icon: Mail },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preferences, integrations, and AI controls</p>
        </div>
        <button
          onClick={fetchIntegrations}
          disabled={loadingIntegrations}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingIntegrations ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ──────────────── TAB 1: APPEARANCE & PROFILE ──────────────── */}
      {activeTab === 'appearance' && (
        <div className="space-y-5">
          {/* Theme Selector (Dark Mode) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Appearance & Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose your preferred workspace interface style</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Light</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Clean & Bright</span>
                  </div>
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center font-bold">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Dark</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Deep & Focused</span>
                  </div>
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>

              {/* System Sync */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  theme === 'system'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">System</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Match OS</span>
                  </div>
                </div>
                {theme === 'system' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Account Profile
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(user?.name || '')}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Executive User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200/60 dark:border-indigo-800 uppercase">
                {user?.role || 'Assistant'}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              Notification Channels
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { key: 'email', label: 'New Email Alerts' },
                { key: 'classification', label: 'AI Classification Updates' },
                { key: 'delegation', label: 'Client Delegations' },
                { key: 'digest', label: 'Daily Executive Briefing' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      notifications[key] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${
                        notifications[key] ? 'left-4.5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: INTEGRATIONS ──────────────── */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Gmail Workspace */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📧</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Gmail Workspace</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">OAuth2 Live Sync</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Connected
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate max-w-[150px]">
                  {integrations.find((i) => i.id === 'gmail-api')?.email || 'gowthamkrishna3107@gmail.com'}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`http://localhost:5000/api/accounts/google/auth?clientId=${
                      selectedClient?._id && selectedClient?._id !== 'all' ? selectedClient._id : ''
                    }`}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Connect
                  </a>
                  <button
                    onClick={() => handleSyncProvider('gmail')}
                    disabled={syncingProvider === 'gmail'}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingProvider === 'gmail' ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Microsoft Outlook */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📬</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Microsoft Outlook</h3>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400">Microsoft Graph</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Connected
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {integrations.find((i) => i.id === 'ms-graph')?.email || 'corporate-m365'}
                </span>
                <button
                  onClick={() => handleSyncProvider('outlook')}
                  disabled={syncingProvider === 'outlook'}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingProvider === 'outlook' ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>
            </div>

            {/* 3. Google Calendar */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Google Calendar</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Appointment Ingestion</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Synced
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {integrations.find((i) => i.id === 'google-calendar')?.meetingCount ?? 0} Meetings
                </span>
                <button
                  onClick={() => handleSyncProvider('google-calendar')}
                  disabled={syncingProvider === 'google-calendar'}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingProvider === 'google-calendar' ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>
            </div>

            {/* 4. MongoDB Atlas Cloud */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">MongoDB Atlas</h3>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">mailpilotcluster</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Live Cluster
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  AWS us-east-1
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-semibold">
                  {integrations.find((i) => i.id === 'mongodb-atlas')?.emailCount ?? 0} Stored
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: AI ENGINE ──────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* Gemini API Key Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  ✦
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Google Gemini Engine</h2>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Active Classifier & Summarizer</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>

            <form onSubmit={handleSaveGeminiKey} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="Custom Gemini API Key (optional)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </select>
                <button
                  type="submit"
                  disabled={savingKey || !geminiKeyInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {savingKey ? 'Saving...' : 'Apply'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Classification Rules
            </h2>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Automatic Responsibility Assignment
              </span>
              <button
                type="button"
                onClick={() => setAiSettings((prev) => ({ ...prev, autoClassify: !prev.autoClassify }))}
                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                  aiSettings.autoClassify ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${
                    aiSettings.autoClassify ? 'left-4.5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Review Threshold
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {aiSettings.confidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={aiSettings.confidenceThreshold}
                onChange={(e) =>
                  setAiSettings((prev) => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: CONNECTED INBOXES ──────────────── */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Direct Email Connector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Register Email Account
            </h2>
            <form onSubmit={handleConnectCustomAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Email address"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Owner / Client Name"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              <select
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook / M365</option>
                <option value="custom">Enterprise IMAP</option>
              </select>
              <button
                type="submit"
                disabled={connectingCustom || !customEmail.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {connectingCustom ? 'Connecting...' : 'Connect'}
              </button>
            </form>
          </div>

          {/* Database & Real Data Management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Real Data Mode</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Wipe simulated mock data</p>
            </div>
            <button
              onClick={handlePurgeDummyData}
              disabled={purging}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {purging ? 'Wiping...' : 'Wipe Mock Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}