import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS } from '../utils/constants';
import SearchBar from '../components/SearchBar';
import NotificationPanel from '../components/NotificationPanel';
import ProfileMenu from '../components/ProfileMenu';
import ClientSelector from '../components/ClientSelector';
import { getInitials, stringToColor } from '../utils/helpers';
import {
  LayoutDashboard, Mail, Bot, User, CheckCircle, AlertCircle,
  Clock, Calendar, Star, Sparkles, Users, Settings, X, Menu, Plane,
  Bell, ExternalLink, Sun, Moon
} from 'lucide-react';

const ICON_MAP = { LayoutDashboard, Mail, Bot, User, CheckCircle, AlertCircle, Clock, Calendar, Star, Sparkles, Users, Settings };

function SidebarLink({ item }) {
  const { emailCounts } = useApp();
  const Icon = ICON_MAP[item.icon] || Mail;
  const count = item.countKey ? emailCounts[item.countKey] : null;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 -ml-[2px] pl-[14px]'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
        }`
      }
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center">
          {count}
        </span>
      )}
    </NavLink>
  );
}

export default function AssistantLayout() {
  const { sidebarOpen, toggleSidebar, closeSidebar, notifications, theme, setTheme } = useApp();
  const { user, switchToClientView } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" alt="MailPilot AI" className="w-9 h-9 object-contain rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight block leading-tight truncate">MailPilot AI</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-none truncate">Your AI Email Assistant</span>
            </div>
          </Link>
          <button onClick={closeSidebar} className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item, i) =>
            item.divider ? (
              <div key={i} className="border-t border-slate-100 dark:border-slate-800 my-3" />
            ) : (
              <SidebarLink key={item.path} item={item} />
            )
          )}

          {/* Quick link to Client-Facing View */}
          <div className="pt-3">
            <button
              onClick={switchToClientView}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/70 dark:border-amber-800/50 transition-colors text-left"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Switch to Client View</span>
            </button>
          </div>
        </nav>

        {/* Client selector at bottom */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <ClientSelector />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-xl">
            <SearchBar placeholder="Search emails, clients..." />
          </div>
          <div className="hidden md:block w-56">
            <ClientSelector compact />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Quick Dark/Light Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
              )}
            </button>
            <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

            {/* Profile Menu Trigger */}
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: stringToColor(user?.name || 'Sarah Mitchell') }}
              >
                {getInitials(user?.name || 'Sarah Mitchell')}
              </div>
            </button>
            <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
