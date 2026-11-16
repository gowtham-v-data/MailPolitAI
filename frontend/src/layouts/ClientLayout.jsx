import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Plane, LogOut, ArrowLeft, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user, logout, switchToAssistantView } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner / Switcher */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="font-medium text-white">Executive Client View</span>
            <span className="text-slate-400 hidden sm:inline">— James Richardson (TechVision Inc)</span>
          </div>
          <button
            onClick={switchToAssistantView}
            className="flex items-center gap-1.5 text-indigo-300 hover:text-white font-medium transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Switch to Assistant Dashboard
          </button>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MailPilot AI" className="w-10 h-10 object-contain rounded-xl flex-shrink-0" />
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight">MailPilot AI</h1>
              <p className="text-xs text-slate-500">Your AI Email Assistant · Executive Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        MailPilot AI · Minimalist Executive Client Interface
      </footer>
    </div>
  );
}
