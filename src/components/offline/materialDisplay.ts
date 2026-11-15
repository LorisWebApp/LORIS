import { BookOpenText, FileText, Headphones, Play, type LucideIcon } from 'lucide-react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import { formatBytes, formatDuration } from '../../lib/format';
import { getMaterialKind, type MaterialKind } from '../../types/offline';

export const kindBadge: Record<MaterialKind, string> = {
  epub: 'EPUB', pdf: 'PDF', audio: 'MP3', video: 'MP4', other: 'FILE',
};

export const actionFor: Record<MaterialKind, { desktop: string; mobile: string; Icon: LucideIcon }> = {
  epub: { desktop: 'Read Offline', mobile: 'Read Offline', Icon: BookOpenText },
  pdf: { desktop: 'Open Document', mobile: 'Open Document', Icon: FileText },
  audio: { desktop: 'Listen Offline', mobile: 'Listen', Icon: Headphones },
  video: { desktop: 'Watch Offline', mobile: 'Watch', Icon: Play },
  other: { desktop: 'Open Document', mobile: 'Open', Icon: FileText },
};

/** "248 pages • 18.4 MB" / "5 hr 24 min • 310 MB" – only parts that are actually known. */
export function fileInfo(m: OfflineMaterialMetadata): string {
  const kind = getMaterialKind(m);
  const parts: string[] = [];
  if ((kind === 'epub' || kind === 'pdf') && m.pageCount) parts.push(`${m.pageCount} pages`);
  if ((kind === 'audio' || kind === 'video') && m.durationSeconds) parts.push(formatDuration(m.durationSeconds));
  parts.push(formatBytes(m.fileSize));
  return parts.join(' • ');
}
