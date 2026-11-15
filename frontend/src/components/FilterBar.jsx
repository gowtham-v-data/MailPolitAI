import React from 'react';
import { X } from 'lucide-react';
import { CLASSIFICATION_CONFIG, PRIORITY_CONFIG } from '../utils/constants';

export default function FilterBar({ filters, onFilterChange, onClear }) {
  const {
    classifications = [],
    priorities = [],
    status = '',
    readStatus = '',
    important = null,
  } = filters;

  const toggleClassification = (c) => {
    const updated = classifications.includes(c)
      ? classifications.filter((x) => x !== c)
      : [...classifications, c];
    onFilterChange({ ...filters, classifications: updated });
  };

  const togglePriority = (p) => {
    const updated = priorities.includes(p)
      ? priorities.filter((x) => x !== p)
      : [...priorities, p];
    onFilterChange({ ...filters, priorities: updated });
  };

  const hasFilters = classifications.length > 0 || priorities.length > 0 || status || readStatus || important !== null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm fade-in">
      <div className="flex flex-wrap gap-6">
        {/* Classification filters */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Classification</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CLASSIFICATION_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => toggleClassification(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                  classifications.includes(key)
                    ? `${config.bgClass} ${config.textClass} ${config.borderClass}`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority filters */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => togglePriority(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                  priorities.includes(key)
                    ? `${config.bgClass} ${config.textClass}`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            {['active', 'completed', 'archived'].map((s) => (
              <button
                key={s}
                onClick={() => onFilterChange({ ...filters, status: status === s ? '' : s })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize ${
                  status === s
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Read/Unread */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Read</label>
          <div className="flex gap-2">
            {['unread', 'read'].map((r) => (
              <button
                key={r}
                onClick={() => onFilterChange({ ...filters, readStatus: readStatus === r ? '' : r })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize ${
                  readStatus === r
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
