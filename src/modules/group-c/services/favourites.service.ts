import { supabase } from '../../../services/supabase';

/** Favourites are persisted in public.user_favourites and scoped by RLS to auth.uid(). */
export async function setFavourite(materialId: string, isFavourite: boolean): Promise<void> {
  const id = materialId.trim();
  if (!id) throw new Error('A valid material ID is required.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Sign in to manage favourites.');

  if (isFavourite) {
    const { data: existing, error: lookupError } = await supabase.from('user_favourites').select('id').eq('user_id', userId).eq('material_id', id).limit(1);
    if (lookupError) throw lookupError;
    if (existing?.length) return;
    const { error } = await supabase.from('user_favourites').insert({ user_id: userId, material_id: id });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('user_favourites').delete()
    .eq('user_id', userId).eq('material_id', id);
  if (error) throw error;
}

export async function listFavouriteIds(): Promise<string[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Sign in to view favourites.');
  const { data, error } = await supabase.from('user_favourites').select('material_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.material_id as string);
}
