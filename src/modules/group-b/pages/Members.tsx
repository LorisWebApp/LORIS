import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Search, Shield, UserPlus } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../../group-a/contexts/AuthContext';
import { PageHeader, Button, StatusBadge, ToastNotification } from '../shared';

type MemberRow = { id: string; user_id: string; role: 'admin' | 'end_user'; status: 'pending' | 'active' | 'suspended'; joined_at: string; profile?: { full_name?: string; email?: string } | null };

export default function Members() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [adminOrganisationIds, setAdminOrganisationIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: ownMemberships, error: ownError } = await supabase.from('Memberships').select('organisation_id').eq('user_id', profile.id).eq('role', 'admin').eq('status', 'active');
      if (ownError) throw ownError;
      const ids = (ownMemberships ?? []).map((x) => Number(x.organisation_id)).filter(Number.isFinite);
      setAdminOrganisationIds(ids);
      if (!ids.length) { setMembers([]); return; }
      const { data, error } = await supabase.from('Memberships')
        .select('id,user_id,role,status,joined_at,profile:Profiles!fk_membership_profile(full_name,email)')
        .in('organisation_id', ids).order('joined_at', { ascending: false });
      if (error) throw error;
      setMembers((data ?? []) as MemberRow[]);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Could not load organisation members.', variant: 'error' });
    } finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => members.filter((member) => `${member.profile?.full_name ?? ''} ${member.profile?.email ?? ''}`.toLowerCase().includes(search.toLowerCase())), [members, search]);

  async function updateMember(id: string, patch: Partial<Pick<MemberRow, 'role' | 'status'>>) {
    setBusyId(id);
    try {
      const { error } = await supabase.from('Memberships').update(patch).eq('id', id);
      if (error) throw error;
      await load();
      setToast({ message: 'Membership updated.', variant: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Membership update failed.', variant: 'error' });
    } finally { setBusyId(null); }
  }

  return <div className="min-h-screen bg-page pb-16">
    <div className="border-b border-line bg-white"><div className="mx-auto max-w-[1312px] px-6 py-8"><PageHeader title="Members" description="Manage active and pending access to your organisation's library." breadcrumbs={[{ label: 'Dashboard', to: '/manage' }, { label: 'Members' }]} /></div></div>
    <main className="mx-auto max-w-[1312px] space-y-6 px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-semibold text-deep">Organisation memberships</h2><p className="mt-1 text-muted">Membership information is loaded from Supabase.</p></div><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search members…" className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 outline-none focus:border-brand"/></div></div>
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        {loading ? <p className="p-8 text-muted">Loading memberships…</p> : !adminOrganisationIds.length ? <p className="p-8 text-muted">Your account has no active organisation-admin membership.</p> : !filtered.length ? <div className="p-10 text-center"><UserPlus className="mx-auto text-brand"/><h3 className="mt-3 text-lg font-semibold">No members found</h3><p className="mt-1 text-muted">There are no matching membership records.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Member</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Joined</th><th className="p-4">Actions</th></tr></thead><tbody>{filtered.map((m)=><tr key={m.id} className="border-t border-line"><td className="p-4"><div className="font-semibold">{m.profile?.full_name || 'Unnamed user'}</div><div className="text-muted">{m.profile?.email || 'No email available'}</div></td><td className="p-4"><span className="inline-flex items-center gap-2"><Shield size={14}/>{m.role}</span></td><td className="p-4"><StatusBadge label={m.status} variant={m.status==='active'?'success':m.status==='pending'?'warning':'danger'}/></td><td className="p-4 text-muted">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td><td className="p-4"><div className="flex flex-wrap gap-2">{m.status==='pending' && <Button size="sm" disabled={busyId===m.id} onClick={()=>void updateMember(m.id,{status:'active'})}>Approve</Button>}{m.status==='active' && <Button size="sm" variant="outline" disabled={busyId===m.id} onClick={()=>void updateMember(m.id,{status:'suspended'})}>Suspend</Button>}{m.status==='suspended' && <Button size="sm" variant="outline" disabled={busyId===m.id} onClick={()=>void updateMember(m.id,{status:'active'})}>Reactivate</Button>}{m.role==='end_user' && m.status==='active' && <Button size="sm" variant="text" disabled={busyId===m.id} onClick={()=>void updateMember(m.id,{role:'admin'})}>Make admin</Button>}</div></td></tr>)}</tbody></table></div>}
      </section>
      <div className="flex items-start gap-3 rounded-lg border border-line bg-mint-soft p-4 text-sm text-brand-text"><Mail size={18} className="mt-0.5 shrink-0"/><p>New invitation codes are not enabled yet because the supplied database schema does not include an invitation table. No invitation is reported as sent until that workflow is implemented.</p></div>
    </main>
    <ToastNotification open={!!toast} message={toast?.message ?? ''} variant={toast?.variant ?? 'info'} onClose={()=>setToast(null)} placement="top-right"/>
  </div>;
}
