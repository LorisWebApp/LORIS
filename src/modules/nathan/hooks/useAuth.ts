import { useCallback, useEffect, useState } from 'react';
import { useAuth as useGroupAAuth } from '../../group-a/contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import type { User } from '../types/user';

/** Compatibility adapter: Nathan's retained screens consume the single Group A Supabase session. */
export function useAuth() {
  const auth = useGroupAAuth();
  const [membershipRole, setMembershipRole] = useState<'admin' | 'end_user'>('end_user');
  useEffect(() => {
    let live = true;
    if (!auth.profile?.id) { setMembershipRole('end_user'); return; }
    void supabase.from('Memberships').select('role').eq('user_id', auth.profile.id).eq('status', 'active').then(({ data }) => {
      if (live) setMembershipRole(data?.some((row) => row.role === 'admin') ? 'admin' : 'end_user');
    });
    return () => { live = false; };
  }, [auth.profile?.id]);
  const role = auth.profile?.platform_role === 'platform_manager' ? 'platform_manager' : membershipRole;
  const user: User | null = auth.user ? {
    id: auth.user.id,
    email: auth.user.email ?? '',
    fullName: auth.profile?.full_name ?? auth.user.email ?? 'LORIS user',
    role,
    emailVerified: Boolean(auth.user.email_confirmed_at),
  } : null;
  const login = useCallback(async (payload: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return an authenticated user.');
    return { id: data.user.id, email: data.user.email ?? '', fullName: String(data.user.user_metadata?.full_name ?? data.user.email ?? ''), role: 'end_user' as const, emailVerified: Boolean(data.user.email_confirmed_at) };
  }, []);
  const logout = useCallback(async () => auth.signOut(), [auth.signOut]);
  const refresh = useCallback(async () => { await supabase.auth.getUser(); }, []);
  return { user, status: auth.loading ? 'loading' as const : user ? 'authenticated' as const : 'unauthenticated' as const, isAuthenticated: Boolean(user), login, logout, refresh };
}
