import { supabase } from '../../../services/supabase';
import type { SavedProgress } from '../types/reader.types';

function validate(progress: SavedProgress) {
  if (!progress.materialId || !Number.isInteger(progress.page) || !Number.isInteger(progress.totalPages) || progress.totalPages < 1 || progress.page < 1 || progress.page > progress.totalPages || progress.percent < 0 || progress.percent > 100) throw new Error('The reading progress information is invalid.');
}
async function currentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const id = data.session?.user.id;
  if (!id) throw new Error('Sign in to save reading progress.');
  return id;
}
export const readingProgressService = {
  async get(materialId: string): Promise<SavedProgress | null> {
    if (!materialId.trim()) return null;
    const userId = await currentUserId();
    const { data, error } = await supabase.from('reading_progress').select('*').eq('user_id', userId).eq('material_id', materialId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { materialId: data.material_id, page: data.current_page, totalPages: data.total_pages ?? 1, percent: Number(data.progress_percentage), completed: data.completed, updatedAt: data.updated_at };
  },
  async save(progress: SavedProgress): Promise<void> {
    validate(progress);
    const userId = await currentUserId();
    const payload = { current_page: progress.page, total_pages: progress.totalPages, progress_percentage: progress.percent, completed: progress.completed, last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: existing, error: findError } = await supabase.from('reading_progress').select('id').eq('user_id', userId).eq('material_id', progress.materialId).maybeSingle();
    if (findError) throw findError;
    const result = existing
      ? await supabase.from('reading_progress').update(payload).eq('id', existing.id).eq('user_id', userId)
      : await supabase.from('reading_progress').insert({ ...payload, user_id: userId, material_id: progress.materialId });
    if (result.error) throw result.error;
  },
};
