import React from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeTime } from '../utils/helpers';

const TYPE_ICONS = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
};

const TYPE_COLORS = {
  info: 'text-blue-500 bg-blue-50',
  warning: 'text-amber-500 bg-amber-50',
  success: 'text-emerald-500 bg-emerald-50',
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-slate-100 z-40 fade-in overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No new notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Info;
              const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.info;
              return (
                <div
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-50 ${
                    !notification.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                      {notification.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(notification.time)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
