// Classification types
export const CLASSIFICATIONS = {
  ASSISTANT_TO_REPLY: 'ASSISTANT_TO_REPLY',
  CLIENT_TO_REPLY: 'CLIENT_TO_REPLY',
  NO_REPLY_NEEDED: 'NO_REPLY_NEEDED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
};

export const CLASSIFICATION_CONFIG = {
  ASSISTANT_TO_REPLY: {
    label: 'Assistant',
    shortLabel: 'Assistant',
    color: 'indigo',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500',
    hex: '#6366F1',
  },
  CLIENT_TO_REPLY: {
    label: 'Client',
    shortLabel: 'Client',
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
    hex: '#F59E0B',
  },
  NO_REPLY_NEEDED: {
    label: 'No Reply',
    shortLabel: 'No Reply',
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
    hex: '#10B981',
  },
  NEEDS_REVIEW: {
    label: 'Review',
    shortLabel: 'Review',
    color: 'red',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
    hex: '#EF4444',
  },
};

export const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    dotClass: 'bg-red-500',
  },
  MEDIUM: {
    label: 'Medium',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  LOW: {
    label: 'Low',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-600',
    dotClass: 'bg-slate-400',
  },
};

export const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: 'LayoutDashboard', section: 'main' },
  { path: '/emails', label: 'All Emails', icon: 'Mail', section: 'main' },
  { path: '/emails/ASSISTANT_TO_REPLY', label: 'Assistant to Reply', icon: 'Bot', section: 'email', countKey: 'assistantToReply' },
  { path: '/emails/CLIENT_TO_REPLY', label: 'Client to Reply', icon: 'User', section: 'email', countKey: 'clientToReply' },
  { path: '/emails/NO_REPLY_NEEDED', label: 'No Reply Needed', icon: 'CheckCircle', section: 'email' },
  { path: '/emails/NEEDS_REVIEW', label: 'Action Required', icon: 'AlertCircle', section: 'email', countKey: 'needsReview' },
  { path: '/meetings', label: 'Meetings', icon: 'Calendar', section: 'main' },
  { divider: true },
  { path: '/ai-assistant', label: 'AI Assistant', icon: 'Sparkles', section: 'tools' },
  { path: '/clients', label: 'Clients', icon: 'Users', section: 'tools' },
  { path: '/settings', label: 'Settings', icon: 'Settings', section: 'tools' },
];

export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'concise', label: 'Concise' },
];

export const EMAIL_PROVIDERS = [
  { id: 'gmail', name: 'Gmail', icon: '📧', color: '#EA4335' },
  { id: 'outlook', name: 'Outlook', icon: '📬', color: '#0078D4' },
  { id: 'yahoo', name: 'Yahoo Mail', icon: '✉️', color: '#6001D2' },
];
