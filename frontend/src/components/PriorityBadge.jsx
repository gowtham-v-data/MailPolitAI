import React from 'react';
import { PRIORITY_CONFIG } from '../utils/constants';

export default function PriorityBadge({ priority, showLabel = false }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${config.bgClass} ${config.textClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`w-2 h-2 rounded-full ${config.dotClass} flex-shrink-0`}
      title={`${config.label} priority`}
    />
  );
}
