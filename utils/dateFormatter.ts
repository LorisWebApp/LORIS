const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const toDate = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function formatDate(iso: string): string {
  const d = toDate(iso);
  return d ? dateOnly.format(d) : '—';
}

export function formatWhen(iso: string): string {
  const d = toDate(iso);
  return d ? dateTime.format(d) : '—';
}

/** "just now", "5 min ago", "3 h ago", "2 days ago"; falls back to a date after a week. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const d = toDate(iso);
  if (!d) return '—';
  const seconds = Math.round((now.getTime() - d.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return dateOnly.format(d);
}
