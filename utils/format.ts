const pad = (n: number) => String(n).padStart(2, '0');

export const formatNumber = (n: number) => n.toLocaleString('en-US');

/** "Today, 09:42" · "Yesterday" · "10 Nov 2026" */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThen = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - startThen) / 86_400_000);
  if (days === 0) return `Today, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days === 1) return 'Yesterday';
  return formatDate(iso);
}

/** "13 Nov 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "10 min ago" · "2 hours ago" · "3 days ago" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function formatFileSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

/** "Atla Learning Centre" -> "Atla" (used in friendly headings). */
export const shortOrgName = (name?: string | null) => (name ?? 'Your organisation').trim().split(/\s+/)[0];

/** "8.4 MB" style size from bytes. */
export const bytesToMb = (bytes: number) => bytes / (1024 * 1024);
