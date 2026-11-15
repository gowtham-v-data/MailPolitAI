import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Generate a consistent color from a string (name/email)
 */
export function stringToColor(str) {
  if (!str) return '#6366F1';
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4',
    '#8B5CF6', '#D946EF', '#0EA5E9', '#84CC16', '#A855F7',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a name string
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Format a date/timestamp for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return format(date, 'EEEE');
    }
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Format relative time ("2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

/**
 * Format full date/time
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, yyyy \'at\' h:mm a');
  } catch {
    return dateStr;
  }
}

/**
 * Format meeting date
 */
export function formatMeetingDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

/**
 * Format meeting time
 */
export function formatMeetingTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'h:mm a');
  } catch {
    return dateStr;
  }
}

/**
 * Truncate text to a max length
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Classify an email's classification to a URL-safe path
 */
export function classificationToPath(classification) {
  return classification;
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
