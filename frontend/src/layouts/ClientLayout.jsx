import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Plane, LogOut } from 'lucide-react';

export default function ClientLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('mailpilot_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">MailPilot AI</h1>
              <p className="text-xs text-slate-500">Your Attention Required</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
