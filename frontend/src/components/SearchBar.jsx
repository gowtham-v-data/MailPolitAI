import React, { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search emails...',
  className = '',
  autoFocus = false,
  enableShortcut = true,
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const currentValue = isControlled ? value : internalValue;
  const inputRef = useRef(null);

  // Global Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    if (!enableShortcut) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut]);

  const handleChange = (newVal) => {
    if (!isControlled) {
      setInternalValue(newVal);
    }
    if (typeof onChange === 'function') {
      onChange(newVal);
    }
  };

  const handleClear = () => {
    handleChange('');
    if (typeof onClear === 'function') {
      onClear();
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typeof onSubmit === 'function') {
        onSubmit(currentValue);
      }
    } else if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-14 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs"
      />

      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {currentValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            title="Clear search (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          enableShortcut && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )
        )}
      </div>
    </div>
  );
}
