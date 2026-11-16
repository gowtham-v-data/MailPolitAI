import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import * as api from '../api';
import EmailCard from '../components/EmailCard';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { CLASSIFICATION_CONFIG } from '../utils/constants';
import { Mail, SlidersHorizontal, ChevronLeft, ChevronRight, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';

const TITLES = {
  ASSISTANT_TO_REPLY: 'Assistant to Reply',
  CLIENT_TO_REPLY: 'Client to Reply',
  NO_REPLY_NEEDED: 'No Reply Needed',
  NEEDS_REVIEW: 'Action Required',
};

export default function EmailInbox() {
  const { classification } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedClient, fetchEmailCounts } = useApp();
  const toast = useToast();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classification: classification || '',
    priority: '',
    status: '',
    isUnread: searchParams.get('isUnread') || '',
    isImportant: searchParams.get('isImportant') || '',
  });

  const title = classification ? TITLES[classification] || classification : 'All Emails';

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        sort: sort === 'newest' ? 'newest' : sort === 'oldest' ? 'oldest' : 'priority',
      };
      if (selectedClient?._id && selectedClient._id !== 'all') params.clientId = selectedClient._id;
      if (classification) params.classification = classification;
      else if (filters.classification) params.classification = filters.classification;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.isUnread === 'true') params.isUnread = 'true';
      if (filters.isImportant === 'true') params.isImportant = 'true';
      if (search) params.search = search;

      const res = await api.getEmails(params);
      setEmails(res.data?.emails || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, page, limit, sort, search, classification, filters]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);
  useEffect(() => { setPage(1); }, [classification, search, filters, limit]);

  const handleSyncEmails = async () => {
    setSyncing(true);
    try {
      const clientId = (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : undefined;
      const res = await api.syncIntegrationProvider('gmail', clientId);
      toast.success(res.data?.message || 'Inbox synchronized successfully');
      fetchEmails();
      if (fetchEmailCounts) fetchEmailCounts();
    } catch {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleImportant = async (id) => {
    try {
      await api.toggleImportant(id);
      setEmails(prev => prev.map(e => e._id === id ? { ...e, isImportant: !e.isImportant } : e));
    } catch (err) { console.error(err); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{total} email{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncEmails}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
            title="Sync up to 50 real emails from connected Gmail"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Emails'}
          </button>
          <div className="w-56 sm:w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Search emails..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      {showFilters && !classification && (
        <div className="mb-4">
          <FilterBar
            filters={filters}
            onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }))}
            onClear={() => setFilters({ classification: '', priority: '', status: '', isUnread: '', isImportant: '' })}
          />
        </div>
      )}

      {/* Email List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : emails.length === 0 ? (
          search || classification || Object.values(filters).some(v => v) ? (
            <EmptyState
              icon={Mail}
              title="No emails found"
              description={search ? 'Try adjusting your search or filters' : 'No emails match the current filters'}
            />
          ) : (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Real Emails Synced Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Connect your Gmail account to start syncing real emails. MailPilot AI will automatically classify each email using Google Gemini AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`http://localhost:5000/api/accounts/google/auth?clientId=${selectedClient?._id && selectedClient?._id !== 'all' ? selectedClient._id : ''}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Connect Google Account
                </a>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Go to Settings
                </Link>
              </div>
            </div>
          )
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {emails.map((email) => (
              <EmailCard
                key={email._id}
                email={{
                  ...email,
                  id: email._id,
                  from: email.sender,
                  isRead: !email.isUnread,
                  date: email.createdAt,
                  priority: email.classification?.priority,
                  classification: email.classification?.type,
                }}
                onToggleImportant={handleToggleImportant}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination & Limit Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-sm gap-3">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="text-xs">Show:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
          >
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <span className="text-xs text-slate-400 dark:text-slate-500">({total} total)</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1 text-xs font-medium">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1 text-xs font-medium">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
