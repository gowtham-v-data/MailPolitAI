import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials, stringToColor } from '../utils/helpers';

export default function ProfileMenu({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-dropdown border border-slate-100 z-40 fade-in overflow-hidden">
        {/* User info */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: stringToColor(user?.name || '') }}
            >
              {getInitials(user?.name || '')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1">
          <button
            onClick={() => handleNavigation('/settings')}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="w-4 h-4 text-slate-400" />
            Profile
          </button>
          <button
            onClick={() => handleNavigation('/settings')}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
          <button
            onClick={() => handleNavigation('/client')}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            View as Client
          </button>
        </div>

        <div className="border-t border-slate-100 py-1">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
