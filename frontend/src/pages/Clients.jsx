import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { stringToColor, getInitials } from '../utils/helpers';
import { Users, Plus, Mail, Building2, Phone, Trash2, Edit2 } from 'lucide-react';

export default function Clients() {
  const { clients, fetchClients } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', company: '', phone: '' }); setModalOpen(true); };
  const openEdit = (client) => { setEditing(client); setForm({ name: client.name, email: client.email, company: client.company || '', phone: client.phone || '' }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.updateClient(editing._id, form);
        toast.success('Client updated');
      } else {
        await api.createClient(form);
        toast.success('Client created');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this client?')) return;
    try {
      await api.deleteClient(id);
      toast.success('Client deactivated');
      fetchClients();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
          const color = stringToColor(client.name);
          return (
            <div key={client._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: color }}>
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-xs text-slate-500">{client.company || 'No company'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${client.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {client.status || 'active'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-3.5 h-3.5" /> {client.email}
                </div>
                {client.company && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Building2 className="w-3.5 h-3.5" /> {client.company}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> {client.phone}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/emails?clientId=${client._id}`)}
                  className="flex-1 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors">
                  View Emails
                </button>
                <button onClick={() => openEdit(client)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(client._id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Client' : 'Add Client'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0100"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={!form.name || !form.email}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
