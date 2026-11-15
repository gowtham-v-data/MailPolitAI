import React from 'react';
import { Bot, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { CLASSIFICATION_CONFIG } from '../utils/constants';

const ICONS = {
  ASSISTANT_TO_REPLY: Bot,
  CLIENT_TO_REPLY: User,
  NO_REPLY_NEEDED: CheckCircle,
  NEEDS_REVIEW: AlertTriangle,
};

export default function ClassificationBadge({ classification, size = 'sm' }) {
  const config = CLASSIFICATION_CONFIG[classification];
  if (!config) return null;

  const Icon = ICONS[classification];
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-3 py-1 text-sm gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bgClass} ${config.textClass} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}
