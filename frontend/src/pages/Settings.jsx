import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { stringToColor, getInitials } from '../utils/helpers';
import { User, Mail, Shield, Bell, Wifi, RefreshCw, Unplug, Sliders } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { selectedClient } = useApp();
  const toast = useToast();
  const [aiSettings, setAiSettings] = useState({ autoClassify: true, confidenceThreshold: 75 });
  const [notifications, setNotifications] = useState({ email: true, classification: true, delegation: true, digest: false });

  const accounts = selectedClient?.connectedAccounts || [];
  const avatarColor = stringToColor(user?.name || '');

  const handleSync = () => {
    toast.success('Sync completed successfully');
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: avatarColor }}>
              {getInitials(user?.name || '')}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-sm text-slate-500">{user?.email || ''}</p>
              <span className="inline-flex px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-full font-medium mt-1">{user?.role || 'assistant'}</span>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Connected Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-400">No connected accounts for the selected client</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{acc.provider === 'gmail' ? '📧' : '📬'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{acc.email}</p>
                      <p className="text-xs text-slate-400">{acc.provider} · {acc.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <button onClick={handleSync} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Sync">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Sliders className="w-4 h-4 text-slate-400" /> AI Classification</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Auto-classify emails</p>
                <p className="text-xs text-slate-400">AI will automatically classify new emails</p>
              </div>
              <button onClick={() => setAiSettings(prev => ({ ...prev, autoClassify: !prev.autoClassify }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${aiSettings.autoClassify ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${aiSettings.autoClassify ? 'left-5' : 'left-1'}`} />
              </button>
            </label>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Confidence threshold</p>
                <span className="text-sm font-semibold text-indigo-600">{aiSettings.confidenceThreshold}%</span>
              </div>
              <input type="range" min={50} max={95} value={aiSettings.confidenceThreshold}
                onChange={(e) => setAiSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full" />
              <p className="text-xs text-slate-400 mt-1">Emails below this confidence will be flagged for review</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-slate-400" /> Notifications</h2>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'New email alerts', desc: 'Get notified when new emails arrive' },
              { key: 'classification', label: 'Classification updates', desc: 'When AI classifies new emails' },
              { key: 'delegation', label: 'Client delegations', desc: 'When a client delegates an email to you' },
              { key: 'digest', label: 'Daily digest', desc: 'Summary of your inbox every morning' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <button onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${notifications[key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[key] ? 'left-5' : 'left-1'}`} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
