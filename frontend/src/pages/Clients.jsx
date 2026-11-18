import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { stringToColor, getInitials } from '../utils/helpers';
import {
  Users,
  Plus,
  Mail,
  Building2,
  Phone,
  Trash2,
  Edit2,
  User,
  UserPlus,
  Search,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function Clients() {
  const { clients, fetchClients } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', company: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Client name and email are required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.updateClient(editing._id || editing.id, form);
        toast.success('Client updated successfully');
      } else {
        await api.createClient(form);
        toast.success('Client created successfully');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name || 'this client'}?`)) return;
    try {
      await api.deleteClient(id);
      toast.success('Client deactivated');
      fetchClients();
    } catch {
      toast.error('Failed to deactivate client');
    }
  };

  const filteredClients = (clients || []).filter((client) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (client.name && client.name.toLowerCase().includes(q)) ||
      (client.email && client.email.toLowerCase().includes(q)) ||
      (client.company && client.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Workspaces
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              {clients.length}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage executive client accounts, connected mailboxes, and delegation settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
            />
          </div>

          <button
            onClick={openAdd}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientId = client._id || client.id;
            const color = stringToColor(client.name);
            const initials = getInitials(client.name);

            return (
              <div
                key={clientId}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-800"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {client.company || 'Private Workspace'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full font-medium inline-flex items-center gap-1.5 shrink-0 ${
                        client.status === 'active' || !client.status
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {client.status || 'Active'}
                    </span>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 mb-5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.company && (
                      <div className="flex items-center gap-2.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.company}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => navigate(`/emails?clientId=${clientId}`)}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span>View Emails</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(client)}
                    title="Edit Client"
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(clientId, client.name)}
                    title="Deactivate Client"
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching clients found' : 'No clients registered yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No results match "${searchQuery}". Try a different keyword.`
              : 'Add an executive client to start managing emails, summaries, and action approvals.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Client</span>
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Edit Client Profile' : 'Add New Client'}
        subtitle={
          editing
            ? 'Update client details and organizational contact preferences'
            : 'Register an executive client workspace to manage email delegations'
        }
        icon={editing ? Edit2 : UserPlus}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Client Name <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="alex.morgan@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Company & Phone (2-column layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Company / Org
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Context tip */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <span className="leading-relaxed">
              Adding a client creates an executive profile. Assistant and executive can collaborate on incoming emails, drafts, and responses.
            </span>
          </div>

          {/* Footer action bar */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 -mx-6 -mb-6 px-6 py-4 mt-6 flex items-center justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.email.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : editing ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
