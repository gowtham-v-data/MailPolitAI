import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import PriorityBadge from '../components/PriorityBadge';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { stringToColor, getInitials, formatDate } from '../utils/helpers';
import { Mail, CheckCircle, ArrowRight, UserCheck, Inbox, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [handledCount, setHandledCount] = useState(0);
  const [delegatedCount, setDelegatedCount] = useState(0);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let token = localStorage.getItem('mailpilot_token');
      // If no token or token is invalid, ensure we have an active session for the client view
      if (!token) {
        try {
          const loginRes = await api.login({ email: 'james@techvision.com', password: 'password123' });
          if (loginRes.data?.token) {
            token = loginRes.data.token;
            localStorage.setItem('mailpilot_token', token);
          }
        } catch (loginErr) {
          console.warn('Auto-login as client failed, attempting assistant fallback:', loginErr);
          const fallbackRes = await api.login({ email: 'sarah@mailpilot.ai', password: 'password123' });
          if (fallbackRes.data?.token) {
            token = fallbackRes.data.token;
            localStorage.setItem('mailpilot_token', token);
          }
        }
      }

      // Fetch emails classified as CLIENT_TO_REPLY
      const res = await api.getEmails({ classification: 'CLIENT_TO_REPLY', status: 'active', limit: 50 });
      setEmails(res.data?.emails || []);
    } catch (err) {
      console.error('Failed to fetch client emails:', err);
      // If unauthorized, attempt one re-login and retry
      if (err.response?.status === 401) {
        try {
          localStorage.removeItem('mailpilot_token');
          const loginRes = await api.login({ email: 'james@techvision.com', password: 'password123' });
          localStorage.setItem('mailpilot_token', loginRes.data.token);
          const retryRes = await api.getEmails({ classification: 'CLIENT_TO_REPLY', status: 'active', limit: 50 });
          setEmails(retryRes.data?.emails || []);
          setLoading(false);
          return;
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
        }
      }
      setError('Could not load emails. Please check your connection or sign in again.');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleMarkHandled = async (emailId) => {
    try {
      await api.completeEmail(emailId);
      setEmails((prev) => prev.filter((e) => e._id !== emailId));
      setHandledCount((prev) => prev + 1);
      toast.success('Marked as handled ✓');
    } catch {
      toast.error('Action failed. Please try again.');
    }
  };

  const handleDelegate = async (emailId) => {
    try {
      await api.delegateEmail(emailId);
      setEmails((prev) => prev.filter((e) => e._id !== emailId));
      setDelegatedCount((prev) => prev + 1);
      toast.success('Delegated to your assistant Sarah ✓');
    } catch {
      toast.error('Delegation failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner />
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading your priority items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Failed to load conversations</h3>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchEmails}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Action Required</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Emails below have been automatically identified by AI as requiring your personal decision or input. All other routine emails are handled directly by your assistant.
            </p>
          </div>
          <button
            onClick={fetchEmails}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 text-center">
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/60 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{emails.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Requiring Attention</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 text-center">
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{handledCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Handled Today</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4 text-center">
          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg flex items-center justify-center mx-auto mb-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{delegatedCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Delegated to Assistant</p>
        </div>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You're all caught up! ✓"
          description="No emails require your personal attention right now. Your assistant is managing all routine inquiries."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Pending Items ({emails.length})
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Sorted by urgency
            </span>
          </div>

          {emails.map((email) => {
            const senderName = email.sender?.name || email.sender?.email || 'Unknown Sender';
            const color = stringToColor(senderName);
            return (
              <div
                key={email._id}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(senderName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {senderName}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                            onClick={() => navigate(`/client/email/${email._id}`)}>
                          {email.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 self-start flex-shrink-0">
                        <PriorityBadge priority={email.classification?.priority} />
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {formatDate(email.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* AI Executive Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 my-2.5 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        AI Summary
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {email.classification?.summary || email.preview || 'No summary available'}
                      </p>
                    </div>

                    {/* Why attention needed */}
                    <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 rounded-lg p-2.5 my-2">
                      <span className="font-semibold flex-shrink-0">Why you need to respond:</span>
                      <span className="italic">{email.classification?.reason || 'This conversation requires executive authorization.'}</span>
                    </div>

                    {/* Suggested Action */}
                    {email.classification?.suggestedAction && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium my-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Suggested Action: </span>
                        {email.classification.suggestedAction}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => navigate(`/client/email/${email._id}`)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        Open Conversation <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMarkHandled(email._id)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors inline-flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Handled
                      </button>
                      <button
                        onClick={() => handleDelegate(email._id)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Delegate to Assistant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
