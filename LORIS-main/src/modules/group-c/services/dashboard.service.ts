import { supabase } from '../../../services/supabase';
import { getLibrary } from './library.service';
import type { DashboardData, LibraryMaterial, OfflineDownloadStatus } from '../types/userLibrary.types';

function material(row: Record<string, any>): LibraryMaterial {
  const raw = String(row.file_type ?? '').toLowerCase();
  const format = raw.includes('epub') ? 'EPUB' : raw.includes('audio') || raw.includes('mpeg') ? 'MP3' : raw.includes('video') || raw.includes('mp4') ? 'MP4' : 'PDF';
  return { id: row.id, title: row.title, author: row.author ?? '', category: row.category?.name ?? 'General', format, kind: format === 'MP3' ? 'audio' : format === 'MP4' ? 'video' : 'book', coverUrl: row.image_url ?? null, fileSizeBytes: row.file_size ?? undefined };
}
export async function fetchDashboard(): Promise<DashboardData> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Sign in to load your dashboard.');
  const [profileResult, library, materialsResult, offlineResult, notesResult, highlightsResult, bookmarksResult] = await Promise.all([
    supabase.from('Profiles').select('full_name').eq('auth_user_id', auth.user.id).single(),
    getLibrary(),
    supabase.from('materials').select('*, category:categories(name)').eq('status', 'published').order('created_at', { ascending: false }).limit(30),
    supabase.from('offline_downloads').select('*, material:materials(*)').eq('user_id', auth.user.id),
    supabase.from('user_notes').select('id').eq('user_id', auth.user.id),
    supabase.from('user_highlights').select('id').eq('user_id', auth.user.id),
    supabase.from('user_bookmarks').select('id, material_id').eq('user_id', auth.user.id),
  ]);
  for (const result of [profileResult, materialsResult, offlineResult, notesResult, highlightsResult, bookmarksResult]) if (result.error) throw result.error;
  if (!profileResult.data) throw new Error('Your LORIS profile could not be found.');
  const fullName = profileResult.data.full_name || auth.user.email || 'LORIS reader';
  const allMaterials = (materialsResult.data ?? []).map((row) => material(row as Record<string, any>));
  const shelf = [...library.inProgress, ...library.completed];
  const annotations = [
    ...(notesResult.data ?? []).map((row) => ({ id: row.id, type: 'note' as const, materialId: '', materialTitle: '', page: 1, createdAt: '' })),
    ...(highlightsResult.data ?? []).map((row) => ({ id: row.id, type: 'highlight' as const, materialId: '', materialTitle: '', page: 1, createdAt: '' })),
  ];
  const downloads = (offlineResult.data ?? []).flatMap((row) => {
    if (!row.material) return [];
    const status: OfflineDownloadStatus = row.download_status === 'available' ? 'ready' : row.download_status === 'pending' ? 'downloading' : row.download_status === 'expired' ? 'expired' : 'failed';
    return [{ id: row.id, material: material(row.material as Record<string, any>), sizeBytes: Number(row.material.file_size ?? 0), downloadedAt: row.downloaded_at ?? row.created_at, expiresAt: row.expires_at, status }];
  });
  const recommended = allMaterials.filter((item) => !shelf.some((entry) => entry.material.id === item.id) && !library.favourites.some((fav) => fav.id === item.id)).slice(0, 6);
  const currentlyReading = shelf.filter((entry) => !entry.progress.completed).sort((a,b) => b.progress.lastReadAt.localeCompare(a.progress.lastReadAt))[0] ?? null;
  return {
    user: { firstName: fullName.split(/\s+/)[0], displayName: fullName },
    stats: { activeBooks: library.inProgress.length, notesAndQuotes: (notesResult.data?.length ?? 0) + (highlightsResult.data?.length ?? 0), offlineReady: downloads.filter((d) => d.status === 'ready').length, readingStreakDays: 0 },
    counts: { inProgress: library.inProgress.length, favourites: library.favourites.length, bookmarks: bookmarksResult.data?.length ?? 0 },
    currentlyReading, shelf, favourites: library.favourites, bookmarked: [], favouriteIds: library.favourites.map((x) => x.id), annotations,
    offline: { downloads }, recommended, lastSyncedAt: new Date().toISOString(),
  };
}
export async function removeOfflineDownload(downloadId: string): Promise<void> {
  if (!downloadId.trim()) throw new Error('A valid download ID is required.');
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = session.session?.user.id;
  if (!userId) throw new Error('Sign in to manage offline downloads.');
  const { error } = await supabase.from('offline_downloads').delete().eq('id', downloadId).eq('user_id', userId);
  if (error) throw error;
}
