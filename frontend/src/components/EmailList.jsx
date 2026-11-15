import React from 'react';
import EmailCard from './EmailCard';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { Mail } from 'lucide-react';

export default function EmailList({
  emails,
  loading,
  onToggleImportant,
  onMarkRead,
  onEmailClick,
  compact = false,
  emptyTitle = 'No emails found',
  emptyDescription = 'Try adjusting your filters or check back later.',
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton w-32" />
              <div className="h-4 skeleton w-full" />
              <div className="h-3 skeleton w-3/4" />
            </div>
            <div className="space-y-2">
              <div className="h-3 skeleton w-16" />
              <div className="h-5 skeleton w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <EmptyState
          icon={Mail}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {emails.map((email) => (
        <EmailCard
          key={email._id || email.id}
          email={email}
          onClick={onEmailClick}
          onToggleImportant={onToggleImportant}
          onMarkRead={onMarkRead}
          compact={compact}
        />
      ))}
    </div>
  );
}
