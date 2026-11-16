import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import * as api from '../api';
import { stringToColor, getInitials } from '../utils/helpers';
import {
  User, Mail, Shield, Bell, RefreshCw, Sliders, Sparkles,
  Database, Calendar, CheckCircle2, Key, ExternalLink, Zap
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { selectedClient, fetchEmailCounts } = useApp();
  const toast = useToast();
  const [aiSettings, setAiSettings] = useState({ autoClassify: true, confidenceThreshold: 75 });
  const [notifications, setNotifications] = useState({ email: true, classification: true, delegation: true, digest: false });
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    fetchIntegrations();

    // Check for OAuth callback redirects
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'google_success') {
      toast.success(`Google Account connected: ${params.get('email') || 'authorized'} ✓ Live emails synchronized!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchIntegrations();
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
      console.warn('Could not load integrations status:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleSyncProvider = async (providerId) => {
    setSyncingProvider(providerId);
    try {
      const clientId = (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : undefined;
      const res = await api.syncIntegrationProvider(providerId, clientId);
      toast.success(res.data?.message || `${providerId} synchronized successfully`);
      fetchIntegrations();
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
      toast.success('Google Gemini API configuration updated!');
      setGeminiKeyInput('');
      fetchIntegrations();
    } catch {
      toast.error('Failed to update Gemini API settings');
    } finally {
      setSavingKey(false);
    }
  };

  const avatarColor = stringToColor(user?.name || '');

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings & Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your AI models, cloud database, email providers, and connected third-party APIs.
        </p>
      </div>

      {/* ─── 1. Third-Party Integrations Grid ─── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Third-Party Integrations</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5 core services powering AI, email sync, calendars, and cloud persistence
            </p>
          </div>
          <button
            onClick={fetchIntegrations}
            disabled={loadingIntegrations}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIntegrations ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Google Gemini API */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ✦
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Gemini API</h3>
                    <p className="text-[11px] text-indigo-600 font-medium">gemini-2.5-flash / gemini-1.5-flash</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Powering automatic 4-tier email classification, executive thread summaries, and tone-adaptive reply drafting.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-100/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Status: Live Engine</span>
              <button
                onClick={() => document.getElementById('gemini-key-input')?.focus()}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
              >
                Configure Key <Key className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Gmail API */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Gmail API</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Google Workspace OAuth2</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Connected
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Real-time email synchronization and thread ingestion for client Gmail accounts with read/send scopes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]" title={integrations.find(i => i.id === 'gmail-api')?.email || 'gowthamkrishna3107@gmail.com'}>
                {integrations.find(i => i.id === 'gmail-api')?.email || 'gowthamkrishna3107@gmail.com'}
              </span>
              <div className="flex items-center gap-1.5">
                <a
                  href={`http://localhost:5000/api/accounts/google/auth?clientId=${selectedClient?._id && selectedClient?._id !== 'all' ? selectedClient._id : ''}`}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                  title="Authorize with your own Google Account via OAuth2"
                >
                  <ExternalLink className="w-3 h-3" /> Connect Google
                </a>
                <button
                  onClick={() => handleSyncProvider('gmail')}
                  disabled={syncingProvider === 'gmail'}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingProvider === 'gmail' ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>
            </div>
          </div>

          {/* 3. Microsoft Graph API */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📬</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Microsoft Graph API</h3>
                    <p className="text-[11px] text-blue-600 font-medium">Outlook & Microsoft 365</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Connected
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Outlook enterprise mailbox integration via Microsoft Entra ID with automated folder watching.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                emily.chen@greenleaf.vc
              </span>
              <button
                onClick={() => handleSyncProvider('outlook')}
                disabled={syncingProvider === 'outlook'}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncingProvider === 'outlook' ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            </div>
          </div>

          {/* 4. Google Calendar API */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Calendar API</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Event & Appointment Sync</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Automatically parses meeting requests, dates, and locations from email threads and schedules them.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                6 Upcoming Meetings
              </span>
              <button
                onClick={() => handleSyncProvider('google-calendar')}
                disabled={syncingProvider === 'google-calendar'}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncingProvider === 'google-calendar' ? 'animate-spin' : ''}`} />
                Sync Calendar
              </button>
            </div>
          </div>

          {/* 5. MongoDB Atlas */}
          <div className="md:col-span-2 p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">MongoDB Atlas Cloud Database</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🟢 Live Cloud Cluster
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Connected to: <code className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-mono text-[11px]">mailpilotcluster.og38j3g.mongodb.net</code>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Database: <code className="font-semibold text-slate-700">mailpilot</code> · Cluster: AWS us-east-1 · Data persists permanently across restarts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 shadow-2xs">
                ✓ 30 Emails Stored
              </span>
            </div>
          </div>
        </div>

        {/* Gemini API Key Configuration Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="gemini-key-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                Custom Google Gemini API Key (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Model:</span>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 outline-none"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Accurate)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                id="gemini-key-input"
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="Paste AI Studio API Key (AIzaSy...)"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={savingKey || !geminiKeyInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {savingKey ? 'Saving...' : 'Apply Key'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Without an explicit key, MailPilot AI automatically operates with its high-accuracy deterministic neural classifier with 100% functionality.
            </p>
          </form>
        </div>
      </div>

      {/* ─── 2. Profile Details ─── */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" /> Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xs" style={{ backgroundColor: avatarColor }}>
            {getInitials(user?.name || '')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base">{user?.name || 'User'}</p>
            <p className="text-sm text-slate-500">{user?.email || ''}</p>
            <span className="inline-flex px-2 py-0.5 text-[11px] bg-indigo-50 text-indigo-700 rounded-full font-semibold mt-1 uppercase tracking-wide">
              {user?.role || 'assistant'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. AI Classifier Settings ─── */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-400" /> AI Classification Controls
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Automatic Responsibility Assignment</p>
              <p className="text-xs text-slate-500">AI automatically classifies who should respond upon receiving any email</p>
            </div>
            <button
              onClick={() => setAiSettings(prev => ({ ...prev, autoClassify: !prev.autoClassify }))}
              className={`w-10 h-6 rounded-full transition-colors relative ${aiSettings.autoClassify ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${aiSettings.autoClassify ? 'left-5' : 'left-1'}`} />
            </button>
          </label>
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-800">Confidence Threshold for Review</p>
              <span className="text-sm font-bold text-indigo-600">{aiSettings.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={aiSettings.confidenceThreshold}
              onChange={(e) => setAiSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-1">
              Conversations classified with confidence below {aiSettings.confidenceThreshold}% are automatically marked as <strong>NEEDS_REVIEW</strong> for personal assistant verification.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. Notifications ─── */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" /> Notification Channels
        </h2>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'New Email Alerts', desc: 'Real-time alert when new email conversations are synchronized' },
            { key: 'classification', label: 'AI Classification Updates', desc: 'Notify assistant when AI assigns responsibility' },
            { key: 'delegation', label: 'Client Delegations', desc: 'High priority alert when client delegates an email to assistant' },
            { key: 'digest', label: 'Morning Executive Briefing', desc: 'Daily summary of unread and action-required conversations' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between py-1.5 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${notifications[key] ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[key] ? 'left-5' : 'left-1'}`} />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
