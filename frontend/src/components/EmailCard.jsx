import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import ClassificationBadge from './ClassificationBadge';
import PriorityBadge from './PriorityBadge';
import { stringToColor, getInitials, formatDate } from '../utils/helpers';

function cleanPreview(str) {
  if (!str) return '';
  return String(str)
    .replace(/&([a-zA-Z0-9#]+)[\r\n\s]+([a-zA-Z0-9]+);/g, '&$1$2;')
    .replace(/&nb[\r\n\s]*sp;?/gi, ' ')
    .replace(/&zwn[\r\n\s]*j;?/gi, ' ')
    .replace(/(?:&(?:nbsp|zwnj|zwj|shy);?|\bsp;|\b&nb\b|[\u200B-\u200D\uFEFF\u034F\u2007\u00A0]|[\r\n\s]){4,}/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&zwnj;/gi, '')
    .replace(/&(?:nb|zwn|zw|amp|quot|apos|lt|gt)(?:\s|\.\.\.|$|\b)/gi, ' ')
    .replace(/\bsp;(?:\s|\.\.\.|$|\b)/gi, ' ')
    .replace(/[\u200B-\u200D\uFEFF\u034F\u2007\u00A0]+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export default function EmailCard({ email, onClick, onToggleImportant, onMarkRead, compact = false }) {
  const navigate = useNavigate();
  const isUnread = !email.isRead;
  const avatarColor = stringToColor(email.from?.name || email.from?.email || email.sender || '');
  const senderName = email.from?.name || email.sender || 'Unknown';
  const senderInitials = getInitials(senderName);

  const handleClick = () => {
    if (onClick) {
      onClick(email);
    } else {
      navigate(`/email/${email._id || email.id}`);
    }
  };

  const handleImportant = (e) => {
    e.stopPropagation();
    onToggleImportant?.(email._id || email.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-slate-50 hover:bg-slate-50/80 ${
        isUnread ? 'bg-white border-l-2 border-l-indigo-500' : 'bg-white border-l-2 border-l-transparent'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold mt-0.5"
        style={{ backgroundColor: avatarColor }}
      >
        {senderInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'} truncate`}>
            {senderName}
          </span>
          <PriorityBadge priority={email.priority} />
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
          )}
        </div>
        <p className={`text-sm ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-800'} line-clamp-1`}>
          {email.subject}
        </p>
        {!compact && (
          <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
            {cleanPreview(email.preview || email.snippet || email.body?.substring(0, 100))}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {formatDate(email.date || email.receivedAt || email.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <ClassificationBadge classification={email.classification} size="sm" />
          <button
            onClick={handleImportant}
            className={`p-0.5 rounded opacity-0 group-hover:opacity-100 ${
              email.isImportant ? 'opacity-100 text-amber-400' : 'text-slate-300 hover:text-amber-400'
            }`}
          >
            <Star className="w-4 h-4" fill={email.isImportant ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
