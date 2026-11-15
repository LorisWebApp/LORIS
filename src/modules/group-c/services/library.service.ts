import { supabase } from '../../../services/supabase';
import type { LibraryMaterial, ShelfEntry } from '../types/userLibrary.types';

export interface LibraryOverview { favourites: LibraryMaterial[]; inProgress: ShelfEntry[]; completed: ShelfEntry[] }
function mapMaterial(row: Record<string, any>): LibraryMaterial {
  const raw = String(row.file_type ?? '').toLowerCase();
  const format = raw.includes('pdf') ? 'PDF' : raw.includes('epub') ? 'EPUB' : raw.includes('audio') || raw.includes('mpeg') ? 'MP3' : raw.includes('video') || raw.includes('mp4') ? 'MP4' : 'PDF';
  return { id: row.id, title: row.title, author: row.author ?? '', category: row.category?.name ?? 'General', format, kind: format === 'MP3' ? 'audio' : format === 'MP4' ? 'video' : 'book', coverUrl: row.image_url ?? null, fileSizeBytes: row.file_size ?? undefined };
}
export async function getLibrary(): Promise<LibraryOverview> {
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = session.session?.user.id;
  if (!userId) throw new Error('Sign in to view your library.');
  const [favResult, progressResult] = await Promise.all([
    supabase.from('user_favourites').select('material_id').eq('user_id', userId),
    supabase.from('reading_progress').select('*').eq('user_id', userId),
  ]);
  if (favResult.error) throw favResult.error;
  if (progressResult.error) throw progressResult.error;
  const favouriteIds = (favResult.data ?? []).map((x) => x.material_id as string);
  const progressRows = progressResult.data ?? [];
  const materialIds = [...new Set([...favouriteIds, ...progressRows.map((x) => x.material_id as string)])];
  if (!materialIds.length) return { favourites: [], inProgress: [], completed: [] };
  const { data: materials, error } = await supabase.from('materials').select('*, category:categories(name)').in('id', materialIds).neq('status', 'archived');
  if (error) throw error;
  const mapped = new Map((materials ?? []).map((row) => [row.id as string, mapMaterial(row as Record<string, any>)]));
  const favourites = favouriteIds.map((id) => mapped.get(id)).filter((x): x is LibraryMaterial => Boolean(x));
  const shelf: ShelfEntry[] = progressRows.flatMap((row) => {
    const material = mapped.get(row.material_id);
    if (!material) return [];
    return [{ material, progress: { materialId: row.material_id, percent: Number(row.progress_percentage), currentPage: row.current_page, totalPages: row.total_pages, lastReadAt: row.last_read_at, completed: row.completed }, isOffline: false }];
  });
  return { favourites, inProgress: shelf.filter((x) => !x.progress.completed), completed: shelf.filter((x) => x.progress.completed) };
}
