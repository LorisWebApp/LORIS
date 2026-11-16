import { supabase } from '../../../services/supabase';
import type { ProfileData } from '../types/reader.types';

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in to access your profile.');
  return data.user;
}

export async function getProfile(): Promise<ProfileData> {
  const user = await currentUser();
  const { data, error } = await supabase.from('Profiles').select('id, full_name, email').eq('auth_user_id', user.id).single();
  if (error) throw error;
  return { id: user.id, fullName: data.full_name, email: data.email };
}

export async function updateProfile(fullName: string): Promise<ProfileData> {
  const trimmedName = fullName.trim();
  if (!trimmedName) throw new Error('Your full name cannot be empty.');
  if (trimmedName.length > 100) throw new Error('Your name cannot exceed 100 characters.');
  const user = await currentUser();
  const { data, error } = await supabase.from('Profiles').update({ full_name: trimmedName, updated_at: new Date().toISOString() }).eq('auth_user_id', user.id).select('id, full_name, email').single();
  if (error) throw error;
  return { id: user.id, fullName: data.full_name, email: data.email };
}

export async function changePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new Error('Your new password must contain at least 8 characters.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
