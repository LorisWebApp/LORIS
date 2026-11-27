import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Shield, UserPlus, Check, X, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../../group-a/contexts/AuthContext';
import { PageHeader, Button, StatusBadge, ToastNotification, DataTable, SearchBar, Modal, ConfirmationDialog } from '../shared';

type MemberRow = { id: string; user_id: string; role: 'admin' | 'end_user'; status: 'pending' | 'active' | 'suspended'; joined_at: string; profile?: { full_name?: string; email?: string } | null };
type RequestRow = { id: string; user_id: string; profile?: { full_name?: string; email?: string } | null };
type CodeRow = { id: string; code: string; uses_count: number; max_uses: number; created_at: string };

/* ------------------------------------------------------------------ */
/*  ISOLATED MODAL COMPONENT (Custom & Auto Generate)                  */
/* ------------------------------------------------------------------ */
function GenerateCodeModal({ 
  isOpen, 
  onClose, 
  adminOrganisationId, 
  setToast,
  onCodeGenerated
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  adminOrganisationId: number, 
  setToast: (t: any) => void,
  onCodeGenerated: () => void
}) {
  const [customCode, setCustomCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const saveCode = async (finalCode: string) => {
    if (!adminOrganisationId) return;
    setIsGenerating(true);
    try {
      const { error } = await supabase.from('InvitationCodes').insert({
        organisation_id: adminOrganisationId,
        code: finalCode
      });
      if (error) throw error;
      
      setToast({ message: `Code ${finalCode} generated successfully!`, variant: "success" });
      setCustomCode("");
      onCodeGenerated();
      onClose();
    } catch (error: any) {
      setToast({ message: "Error: " + error.message, variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;
    saveCode(customCode.trim().toUpperCase());
  };

  const handleAutoGenerate = () => {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `LORIS-${randomChars}`;
    saveCode(newCode);
  };

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title="Invitation Codes" 
      description="Generate a secure code to share with potential members."
    >
      <div className="space-y-6 pt-4">
        <form onSubmit={handleCustomSubmit} className="bg-white p-5 rounded-lg border border-line shadow-sm">
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Create a Custom Code</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="flex-1 border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors uppercase" 
              placeholder="e.g. ATLAS-STUDENTS"
            />
            <Button type="submit" loading={isGenerating} variant="outline">Save</Button>
          </div>
        </form>

        <div className="flex items-center gap-4">
          <div className="h-px bg-line flex-1"></div>
          <span className="text-[12px] text-muted uppercase tracking-widest font-semibold">OR</span>
          <div className="h-px bg-line flex-1"></div>
        </div>

        <div className="bg-mint-soft p-5 rounded-lg border border-line text-center">
          <p className="text-[14px] text-muted mb-3">Let LORIS generate a secure, random code for you.</p>
          <Button onClick={handleAutoGenerate} loading={isGenerating} className="w-full">
            Generate Secure Code
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */
export default function Members() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [adminOrganisationIds, setAdminOrganisationIds] = useState<number[]>([]);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null); // NEW state for deleting codes

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: ownMemberships, error: ownError } = await supabase.from('Memberships').select('organisation_id').eq('user_id', profile.id).eq('role', 'admin').eq('status', 'active');
      if (ownError) throw ownError;
      
      const ids = (ownMemberships ?? []).map((x) => Number(x.organisation_id)).filter(Number.isFinite);
      setAdminOrganisationIds(ids);
      
      if (!ids.length) { setMembers([]); setRequests([]); setCodes([]); return; }

      const { data: memberData } = await supabase.from('Memberships')
        .select('id, user_id, role, status, joined_at')
        .in('organisation_id', ids)
        .order('joined_at', { ascending: false });

      if (memberData) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profilesData } = await supabase.from('Profiles').select('id, full_name, email').in('id', userIds);
        const mergedMembers = memberData.map(m => ({
          ...m,
          profile: profilesData?.find(p => p.id === m.user_id) || null
        }));
        setMembers(mergedMembers as MemberRow[]);
      }

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

      const { data: codeData } = await supabase.from('InvitationCodes')
        .select('*')
        .in('organisation_id', ids)
        .order('created_at', { ascending: false });
      if (codeData) setCodes(codeData as CodeRow[]);

    } catch (error) {
      console.error(error);
      setToast({ message: error instanceof Error ? error.message : 'Could not load data.', variant: 'error' });
    } finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { void loadData(); }, [loadData]);

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
      await loadData();
    } catch (error) {
      setToast({ message: 'Failed to approve.', variant: 'error' });
    } finally { setBusyId(null); }
  };

  const handleDenyRequest = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await supabase.from('JoinRequests').delete().eq('id', requestId);
      setToast({ message: 'Request denied.', variant: 'info' });
      await loadData();
    } catch (error) {
      setToast({ message: 'Failed to deny.', variant: 'error' });
    } finally { setBusyId(null); }
  };

  // NEW: Function to delete a code
  const confirmDeleteCode = async () => {
    if (!deleteCodeId) return;
    try {
      const { error } = await supabase.from('InvitationCodes').delete().eq('id', deleteCodeId);
      if (error) throw error;
      setToast({ message: 'Invite code deleted.', variant: 'success' });
      setDeleteCodeId(null);
      await loadData();
    } catch (error: any) {
      setToast({ message: 'Failed to delete code: ' + error.message, variant: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: "Code copied to clipboard!", variant: "success" });
  };

  const filteredMembers = useMemo(() => members.filter((member) => `${member.profile?.full_name ?? ''} ${member.profile?.email ?? ''}`.toLowerCase().includes(search.toLowerCase())), [members, search]);

  const memberColumns = [
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
        <StatusBadge label={row.status.toUpperCase()} variant={row.status === 'active' ? 'success' : 'warning'} dot />
      )
    },
    {
      key: 'joined', header: 'Joined',
      cell: (row: MemberRow) => <span className="text-[14px] text-muted">{row.joined_at ? new Date(row.joined_at).toLocaleDateString() : '—'}</span>
    }
  ];

  // UPDATED: Added Delete Button
  const codeColumns = [
    {
      key: 'code', header: 'Invite Code',
      cell: (row: CodeRow) => (
        <div className="py-2">
          <span className="inline-block font-mono font-bold text-[#0A3D42] text-[16px] tracking-widest bg-[#E3F3EF] border border-[#B0EFE5] px-4 py-2 rounded-lg shadow-sm">
            {row.code}
          </span>
        </div>
      )
    },
    {
      key: 'usage', header: 'Usage Limit',
      cell: (row: CodeRow) => {
        const percentage = Math.min((row.uses_count / row.max_uses) * 100, 100);
        return (
          <div className="w-48">
            <div className="flex justify-between text-[13px] text-muted mb-1 font-medium">
              <span>{row.uses_count} used</span>
              <span>{row.max_uses - row.uses_count} left</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0A3D42] transition-all duration-500" 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions', header: 'Actions', align: 'right' as const,
      cell: (row: CodeRow) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyToClipboard(row.code)}
            leftIcon={<Copy size={14} />}
            className="bg-white hover:bg-mint"
          >
            Copy
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => setDeleteCodeId(row.id)}
            leftIcon={<Trash2 size={14} />}
          >
            Delete
          </Button>
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

      <main className="max-w-[1312px] mx-auto px-8 py-10 space-y-10">
        
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

        <section className="relative bg-deep text-white border border-[#0A3D42] rounded-lg p-8 shadow-md overflow-hidden">
          <div 
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" 
            style={{ maskImage: 'linear-gradient(to right, black, transparent)' }}
          ></div>

          <div className="relative z-10">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-8 bg-[#A8D9DC] rounded-full"></div>
                <h2 className="text-[28px] font-medium leading-tight text-white font-serif">Invitation Codes</h2>
              </div>
              <p className="text-[16px] text-[#A8D9DC] ml-11">Share these codes with potential members to grant them access.</p>
            </div>
            
            <div className="bg-white rounded-lg p-2">
              {codes.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 rounded-lg">
                  <LinkIcon className="mx-auto text-brand mb-3" size={32} />
                  <h3 className="text-lg font-semibold text-deep">No codes generated yet</h3>
                  <p className="mt-1 text-muted">Generate a code to start inviting members.</p>
                </div>
              ) : (
                <DataTable columns={codeColumns} rows={codes} getRowKey={(r: any) => r.id} caption="Invite codes" />
              )}
            </div>
          </div>
        </section>

        <section>
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
            ) : (
              <>
                {filteredMembers.length > 0 && (
                  <DataTable columns={memberColumns} rows={filteredMembers} getRowKey={(r: any) => r.id} caption="Organisation members" />
                )}

                {members.length <= 1 && (
                  <div className={`p-16 text-center flex flex-col items-center justify-center ${filteredMembers.length > 0 ? 'border-t border-line bg-gray-50/50' : ''}`}>
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
        </section>
      </main>

      <GenerateCodeModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        adminOrganisationId={adminOrganisationIds[0]} 
        setToast={setToast}
        onCodeGenerated={loadData}
      />

      {/* DELETE CODE CONFIRMATION DIALOG */}
      <ConfirmationDialog 
        open={!!deleteCodeId} 
        title="Delete Invite Code" 
        description="Are you sure you want to delete this invite code? Anyone with this link will no longer be able to join." 
        tone="danger"
        confirmLabel="Delete Code"
        onConfirm={confirmDeleteCode}
        onCancel={() => setDeleteCodeId(null)}
      />

      <ToastNotification open={!!toast} message={toast?.message ?? ''} variant={toast?.variant ?? 'info'} onClose={() => setToast(null)} placement="top-right" />
    </div>
  );
}