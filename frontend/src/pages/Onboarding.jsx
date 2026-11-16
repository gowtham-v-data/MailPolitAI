import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Sparkles, Mail, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import * as api from '../api';

const STEPS = [
  { title: 'Welcome', desc: 'Introduction to MailPilot AI' },
  { title: 'Connect Accounts', desc: 'Link Gmail or Microsoft 365' },
  { title: 'Sync & Ready', desc: 'AI Classification Active' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(null);
  const [connectedProvider, setConnectedProvider] = useState(null);
  const navigate = useNavigate();

  const handleSimulateOAuth = async (provider) => {
    setConnecting(provider);
    setTimeout(() => {
      setConnectedProvider(provider);
      setConnecting(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${i <= step ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          {step === 0 && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img src="/logo.png" alt="MailPilot AI" className="w-20 h-20 object-contain drop-shadow-sm" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to MailPilot AI</h2>
              <p className="text-indigo-600 font-semibold text-xs tracking-wide uppercase mb-3">AI-Powered Email Management for Personal Assistants</p>
              <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                Personal assistants manage high volumes of client communication. MailPilot AI uses intelligent algorithms to automatically determine <strong>who needs to reply</strong> (Assistant vs. Client) and provides a clean, executive view for your clients.
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                Connect Email Accounts <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Client Inboxes</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Authenticate via secure OAuth2 to synchronize real-time emails and calendar appointments.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                {/* Gmail Option */}
                <div
                  onClick={() => handleSimulateOAuth('gmail')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    connectedProvider === 'gmail'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">📧</span>
                    {connectedProvider === 'gmail' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Connected ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Gmail API</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Google Workspace & Personal</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> OAuth2 Verified
                  </div>
                </div>

                {/* Microsoft Option */}
                <div
                  onClick={() => handleSimulateOAuth('outlook')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    connectedProvider === 'outlook'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">📬</span>
                    {connectedProvider === 'outlook' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Connected ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Microsoft Graph</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Outlook & Office 365</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Entra ID Verified
                  </div>
                </div>
              </div>

              {connecting && (
                <div className="p-3 mb-4 bg-indigo-50 rounded-lg text-xs font-medium text-indigo-700 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authorizing via OAuth2 token exchange...
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!connectedProvider}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2 shadow-xs"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Synchronization Active! 🎉</h2>
              <p className="text-slate-500 mb-3 text-sm">
                Connected via {connectedProvider === 'gmail' ? 'Gmail API' : 'Microsoft Graph API'} · MongoDB Atlas Persisted
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">AI Classification Engine:</span>
                  <span className="font-semibold text-indigo-600">Google Gemini API / Rule Engine</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Email Database:</span>
                  <span className="font-semibold text-emerald-700">MongoDB Atlas Cluster (Live)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Initial Thread Ingestion:</span>
                  <span className="font-semibold text-slate-900">30 Conversations Classified</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                Access Assistant Inbox <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
