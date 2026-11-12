export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function formatBytesShort(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "2d ago", "yesterday", "1w ago" – matches the wording in the designs. */
export function formatSavedAgo(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isToday(date: Date, now = new Date()): boolean {
  return date.toDateString() === now.toDateString();
}

export function formatDayTime(date: Date): string {
  return isToday(date)
    ? `Today, ${formatClock(date)}`
    : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formatClock(date)}`;
}

export function formatSyncedAt(date: Date): string {
  return isToday(date)
    ? `today at ${formatClock(date)}`
    : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${formatClock(date)}`;
}
