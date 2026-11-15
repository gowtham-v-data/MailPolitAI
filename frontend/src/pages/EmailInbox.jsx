import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import EmailCard from '../components/EmailCard';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { CLASSIFICATION_CONFIG } from '../utils/constants';
import { Mail, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const TITLES = {
  ASSISTANT_TO_REPLY: 'Assistant to Reply',
  CLIENT_TO_REPLY: 'Client to Reply',
  NO_REPLY_NEEDED: 'No Reply Needed',
  NEEDS_REVIEW: 'Action Required',
};

export default function EmailInbox() {
  const { classification } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedClient } = useApp();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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

  const limit = 15;
  const title = classification ? TITLES[classification] || classification : 'All Emails';

  const fetchEmails = useCallback(async () => {
    if (!selectedClient?._id) return;
    setLoading(true);
    try {
      const params = { clientId: selectedClient._id, page, limit, sort: sort === 'newest' ? 'newest' : sort === 'oldest' ? 'oldest' : 'priority' };
      if (classification) params.classification = classification;
      else if (filters.classification) params.classification = filters.classification;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.isUnread === 'true') params.isUnread = 'true';
      if (filters.isImportant === 'true') params.isImportant = 'true';
      if (search) params.search = search;

      const res = await api.getEmails(params);
      setEmails(res.data.emails || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setEmails([]);
    }
    setLoading(false);
  }, [selectedClient, page, sort, search, classification, filters]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);
  useEffect(() => { setPage(1); }, [classification, search, filters]);

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
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} email{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Search emails..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails found"
            description={search ? 'Try adjusting your search or filters' : 'No emails match the current filters'}
          />
        ) : (
          <div className="divide-y divide-slate-50">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
