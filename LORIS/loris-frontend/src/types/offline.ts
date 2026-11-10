import type { OfflineMaterialMetadata } from '../group-d/types/models';

export type MaterialKind = 'epub' | 'pdf' | 'audio' | 'video' | 'other';
export type FormatFilter = 'all' | 'epub' | 'pdf' | 'audio' | 'video';

export function getMaterialKind(m: Pick<OfflineMaterialMetadata, 'mimeType' | 'fileName'>): MaterialKind {
  const mime = m.mimeType.toLowerCase();
  const name = m.fileName.toLowerCase();
  if (mime === 'application/epub+zip' || name.endsWith('.epub')) return 'epub';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}

export function isAccessValid(m: OfflineMaterialMetadata, now = new Date()): boolean {
  return now.getTime() <= new Date(m.offlineAllowedUntil).getTime();
}
