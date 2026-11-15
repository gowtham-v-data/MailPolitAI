import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ClassificationBadge from '../components/ClassificationBadge';
import PriorityBadge from '../components/PriorityBadge';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { stringToColor, getInitials, formatDate } from '../utils/helpers';
import { Mail, CheckCircle, ArrowRight, UserCheck, HandMetal, Inbox } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handledCount, setHandledCount] = useState(0);
  const [delegatedCount, setDelegatedCount] = useState(0);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      // Fetch CLIENT_TO_REPLY emails (works without auth for prototype by trying)
      const token = localStorage.getItem('mailpilot_token');
      if (!token) {
        // Auto-login as demo client for prototype
        try {
          const loginRes = await api.login({ email: 'james@techvision.com', password: 'password123' });
          localStorage.setItem('mailpilot_token', loginRes.data.token);
        } catch {
          // Use demo assistant login as fallback
          const loginRes = await api.login({ email: 'sarah@mailpilot.ai', password: 'password123' });
          localStorage.setItem('mailpilot_token', loginRes.data.token);
        }
      }
      const res = await api.getEmails({ classification: 'CLIENT_TO_REPLY', status: 'active' });
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setEmails([]);
    }
    setLoading(false);
  };

  const handleMarkHandled = async (emailId) => {
    try {
      await api.completeEmail(emailId);
      setEmails(prev => prev.filter(e => e._id !== emailId));
      setHandledCount(prev => prev + 1);
      toast.success('Marked as handled');
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDelegate = async (emailId) => {
    try {
      await api.delegateEmail(emailId);
      setEmails(prev => prev.filter(e => e._id !== emailId));
      setDelegatedCount(prev => prev + 1);
      toast.success('Delegated to assistant');
    } catch {
      toast.error('Delegation failed');
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{emails.length}</p>
          <p className="text-xs text-slate-500">Needs Your Response</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{handledCount}</p>
          <p className="text-xs text-slate-500">Handled Today</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{delegatedCount}</p>
          <p className="text-xs text-slate-500">Delegated</p>
        </div>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You're all caught up! ✓"
          description="No emails require your personal attention right now. Your assistant is handling everything."
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Emails Requiring Your Attention</h2>
          {emails.map((email) => {
            const senderName = email.sender?.name || email.sender?.email || 'Unknown';
            const color = stringToColor(senderName);
            return (
              <div key={email._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: color }}>
                    {getInitials(senderName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{senderName}</p>
                        <h3 className="text-base font-semibold text-slate-900">{email.subject}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PriorityBadge priority={email.classification?.priority} />
                        <span className="text-xs text-slate-400">{formatDate(email.createdAt)}</span>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                      {email.classification?.summary || email.preview || 'No summary available'}
                    </p>

                    {/* Why attention needed */}
                    <p className="text-sm text-slate-400 italic mt-1.5">
                      {email.classification?.reason || 'This email requires your personal attention'}
                    </p>

                    {/* Suggested Action */}
                    {email.classification?.suggestedAction && (
                      <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg inline-block">
                        <p className="text-xs text-amber-700 font-medium">💡 {email.classification.suggestedAction}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button onClick={() => navigate(`/client/email/${email._id}`)}
                        className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5">
                        Open Conversation <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleMarkHandled(email._id)}
                        className="px-4 py-1.5 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors inline-flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Handled
                      </button>
                      <button onClick={() => handleDelegate(email._id)}
                        className="px-4 py-1.5 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5">
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
