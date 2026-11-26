 import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Shield, UserPlus, Check, X, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../../group-a/contexts/AuthContext';
import { PageHeader, Button, StatusBadge, ToastNotification, DataTable, SearchBar, Modal } from '../shared';

type MemberRow = { id: string; user_id: string; role: 'admin' | 'end_user'; status: 'pending' | 'active' | 'suspended'; joined_at: string; profile?: { full_name?: string; email?: string } | null };
type RequestRow = { id: string; user_id: string; profile?: { full_name?: string; email?: string } | null };

export default function Members() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [adminOrganisationIds, setAdminOrganisationIds] = useState<number[]>([]);

  // Invite Code Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: ownMemberships, error: ownError } = await supabase.from('Memberships').select('organisation_id').eq('user_id', profile.id).eq('role', 'admin').eq('status', 'active');
      if (ownError) throw ownError;
      
      const ids = (ownMemberships ?? []).map((x) => Number(x.organisation_id)).filter(Number.isFinite);
      setAdminOrganisationIds(ids);
      
      if (!ids.length) { setMembers([]); setRequests([]); return; }

      const { data: memberData, error: memberError } = await supabase.from('Memberships')
        .select('id, user_id, role, status, joined_at')
        .in('organisation_id', ids)
        .order('joined_at', { ascending: false });
      if (memberError) throw memberError;

      const userIds = (memberData ?? []).map(m => m.user_id);
      const { data: profilesData } = await supabase.from('Profiles').select('id, full_name, email').in('id', userIds);
      
      const mergedMembers = (memberData ?? []).map(m => ({
        ...m,
        profile: profilesData?.find(p => p.id === m.user_id) || null
      }));
      setMembers(mergedMembers as MemberRow[]);

      const { data: requestData } = await supabase.from('JoinRequests')
        .select('id, user_id')
        .in('organisation_id', ids)
        .eq('status', 'pending');
        
      if (requestData) {
        const reqUserIds = requestData.map(r => r.user_id);
        const { data: reqProfiles } = await supabase.from('Profiles').select('id, full_name, email').in('id', reqUserIds);
        const mergedRequests = requestData.map(r => ({
          ...r,
          profile: reqProfiles?.find(p => p.id === r.user_id) || null
        }));
        setRequests(mergedRequests as RequestRow[]);
      }

    } catch (error) {
      console.error(error);
      setToast({ message: error instanceof Error ? error.message : 'Could not load organisation members.', variant: 'error' });
    } finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { void load(); }, [load]);

  const handleApproveRequest = async (request: RequestRow) => {
    setBusyId(request.id);
    try {
      await supabase.from('Memberships').insert({
        user_id: request.user_id,
        organisation_id: adminOrganisationIds[0],
        role: 'end_user',
        status: 'active'
      });
      await supabase.from('JoinRequests').delete().eq('id', request.id);
      setToast({ message: 'Member approved.', variant: 'success' });
      await load();
    } catch (error) {
      setToast({ message: 'Failed to approve.', variant: 'error' });
    } finally { setBusyId(null); }
  };

  const handleDenyRequest = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await supabase.from('JoinRequests').delete().eq('id', requestId);
      setToast({ message: 'Request denied.', variant: 'info' });
      await load();
    } catch (error) {
      setToast({ message: 'Failed to deny.', variant: 'error' });
    } finally { setBusyId(null); }
  };

  const handleGenerateCode = async () => {
    if (!inviteCode.trim() || !adminOrganisationIds.length) return;
    setIsGenerating(true);
    
    try {
      const { error } = await supabase.from('InvitationCodes').insert({
        organisation_id: adminOrganisationIds[0],
        code: inviteCode.trim().toUpperCase()
      });

      if (error) throw error;
      
      setToast({ message: "Invite code generated successfully!", variant: "success" });
      setInviteCode("");
      setIsInviteModalOpen(false);
    } catch (error: any) {
      setToast({ message: "Error generating code: " + error.message, variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = useMemo(() => members.filter((member) => `${member.profile?.full_name ?? ''} ${member.profile?.email ?? ''}`.toLowerCase().includes(search.toLowerCase())), [members, search]);

  async function updateMember(id: string, patch: Partial<Pick<MemberRow, 'role' | 'status'>>) {
    setBusyId(id);
    try {
      const { error } = await supabase.from('Memberships').update(patch).eq('id', id);
      if (error) throw error;
      await load();
      setToast({ message: 'Membership updated.', variant: 'success' });
    } catch (error) {
      setToast({ message: 'Update failed.', variant: 'error' });
    } finally { setBusyId(null); }
  }

  const columns = [
    {
      key: 'member', header: 'Member',
      cell: (row: MemberRow) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm shrink-0">
            {row.profile?.full_name ? row.profile.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-semibold text-deep">{row.profile?.full_name || 'Unnamed user'}</p>
            <p className="text-[14px] text-muted">{row.profile?.email || 'No email available'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role', header: 'Role',
      cell: (row: MemberRow) => (
        <div className="flex items-center gap-2 text-deep font-medium capitalize">
          {row.role === 'admin' ? <Shield size={16} className="text-brand" /> : <UserPlus size={16} className="text-muted" />}
          <span>{row.role}</span>
        </div>
      )
    },
    {
      key: 'status', header: 'Status',
      cell: (row: MemberRow) => (
        <StatusBadge label={row.status.toUpperCase()} variant={row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'} dot />
      )
    },
    {
      key: 'joined', header: 'Joined',
      cell: (row: MemberRow) => <span className="text-[14px] text-muted">{row.joined_at ? new Date(row.joined_at).toLocaleDateString() : '—'}</span>
    },
    {
      key: 'actions', header: 'Actions', align: 'right' as const,
      cell: (row: MemberRow) => (
        <div className="flex justify-end gap-2">
          {row.status === 'active' && <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => void updateMember(row.id, { status: 'suspended' })}>Suspend</Button>}
          {row.status === 'suspended' && <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => void updateMember(row.id, { status: 'active' })}>Reactivate</Button>}
          {row.role === 'end_user' && row.status === 'active' && <Button size="sm" variant="text" disabled={busyId === row.id} onClick={() => void updateMember(row.id, { role: 'admin' })}>Make admin</Button>}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-page font-serif pb-20">
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}></div>
        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <PageHeader title="Members" description="Manage your community and access to the library." breadcrumbs={[{ label: "Dashboard", to: "/manage" }, { label: "Members" }]} tone="dark" className="bg-transparent" />
          <Button variant="secondary" leftIcon={<LinkIcon size={18} />} onClick={() => setIsInviteModalOpen(true)}>Generate Invite Code</Button>
        </div>
      </div>

      <main className="max-w-[1312px] mx-auto px-8 py-10 space-y-8">
        
        {requests.length > 0 && (
          <section className="bg-white border border-line shadow-sm rounded-lg p-6">
            <h2 className="text-2xl font-serif text-deep mb-4">Pending Join Requests</h2>
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-mint-soft">
                  <div>
                    <p className="font-semibold text-deep">{req.profile?.full_name || "Unknown User"}</p>
                    <p className="text-[14px] text-muted">{req.profile?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" leftIcon={<Check size={14}/>} onClick={() => handleApproveRequest(req)} loading={busyId === req.id}>Approve</Button>
                    <Button size="sm" variant="danger" leftIcon={<X size={14}/>} onClick={() => handleDenyRequest(req.id)} disabled={busyId === req.id}>Deny</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-serif text-deep">Active Members</h2>
              <p className="text-[15px] text-muted mt-1">People who currently have access to this library.</p>
            </div>
            <div className="w-full md:w-72">
              <SearchBar placeholder="Search members..." value={search} onChange={setSearch} />
            </div>
          </div>

          <div className="bg-white border border-line shadow-sm rounded-lg overflow-hidden">
            {loading ? (
              <p className="p-8 text-center text-muted">Loading memberships…</p>
            ) : !adminOrganisationIds.length ? (
              <p className="p-8 text-center text-muted">Your account has no active organisation-admin membership.</p>
            ) : (
              <>
                {/* 1. ALWAYS SHOW THE TABLE (So the Admin is visible) */}
                {filtered.length > 0 && (
                  <DataTable columns={columns} rows={filtered} getRowKey={(r: any) => r.id} caption="Organisation members" />
                )}

                {/* 2. SHOW EMPTY STATE ONLY IF THE ADMIN IS THE ONLY MEMBER (or no search results) */}
                {members.length <= 1 && (
                  <div className={`p-16 text-center flex flex-col items-center justify-center ${filtered.length > 0 ? 'border-t border-line bg-gray-50/50' : ''}`}>
                    <div className="h-20 w-20 bg-mint rounded-full flex items-center justify-center mb-6">
                      <UserPlus className="text-brand" size={32} />
                    </div>
                    <h3 className="text-2xl font-serif text-deep mb-2">Grow your community</h3>
                    <p className="text-muted max-w-md mx-auto mb-8">
                      Invite students, staff, or team members to access your library's digital resources.
                    </p>
                    <Button 
                      onClick={() => setIsInviteModalOpen(true)} 
                      className="px-6 py-3 text-[15px]" 
                      leftIcon={<Mail size={18} />}
                    >
                      Invite via Email
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </main>

      {/* INVITE CODE MODAL */}
      <Modal 
        open={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        title="Generate Invitation Code" 
        description="Create a code to share with potential members. They will use this to register and gain access to your library."
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Invite Code</label>
            <input 
              type="text" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors uppercase" 
              placeholder="e.g. ATLAS-2026"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button variant="text" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateCode} loading={isGenerating}>Generate Code</Button>
          </div>
        </div>
      </Modal>

      <ToastNotification open={!!toast} message={toast?.message ?? ''} variant={toast?.variant ?? 'info'} onClose={() => setToast(null)} placement="top-right" />
    </div>
  );
}     