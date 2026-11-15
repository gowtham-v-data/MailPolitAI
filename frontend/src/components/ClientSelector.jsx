import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials, stringToColor } from '../utils/helpers';

export default function ClientSelector({ compact = false }) {
  const { clients, selectedClient, setSelectedClient } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!clients || clients.length === 0) return null;

  const clientName = selectedClient?.name || 'Select Client';
  const clientCompany = selectedClient?.company || '';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full text-left rounded-lg border border-slate-200 hover:border-slate-300 bg-white ${
          compact ? 'px-3 py-2' : 'px-3 py-2.5'
        }`}
      >
        {selectedClient && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: stringToColor(selectedClient.name) }}
          >
            {getInitials(selectedClient.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{clientName}</p>
          {!compact && clientCompany && (
            <p className="text-xs text-slate-500 truncate">{clientCompany}</p>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-dropdown border border-slate-100 z-40 py-1 max-h-64 overflow-y-auto fade-in">
            {clients.map((client) => {
              const isSelected = (selectedClient?._id || selectedClient?.id) === (client._id || client.id);
              return (
                <button
                  key={client._id || client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 ${
                    isSelected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: stringToColor(client.name) }}
                  >
                    {getInitials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-slate-900 truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 truncate">{client.company || client.email}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
