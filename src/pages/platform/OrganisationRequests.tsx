import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';

type RequestStatus = 'pending' | 'approved' | 'rejected';
type OrganisationRequest = {
  id: string;
  organisation_name: string;
  email: string;
  type?: string | null;
  country?: string | null;
  province_state?: string | null;
  city_town?: string | null;
  postal_code?: string | null;
  status: RequestStatus;
  created_at?: string | null;
};

const tabs: { id: RequestStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];


export default function OrganisationRequests() {
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [rows, setRows] = useState<OrganisationRequest[]>([]);
  const [counts, setCounts] = useState<Record<RequestStatus, number>>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [list, pending, approved, rejected] = await Promise.all([
      supabase.from('organisation_requests').select('*').eq('status', status).order('created_at', { ascending: false }),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    if (list.error) setError(list.error.message);
    else setRows((list.data ?? []) as OrganisationRequest[]);
    setCounts({ pending: pending.count ?? 0, approved: approved.count ?? 0, rejected: rejected.count ?? 0 });
    setLoading(false);
  }, [status]);

  useEffect(() => { void load(); }, [load]);


  async function review(id: string, decision: 'approved' | 'rejected') {
    const verb = decision === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${verb} this organisation request?`)) return;
    setBusyId(id); setError(''); setNotice('');
    const { error: reviewError } = await supabase.rpc('loris_review_organisation_request', {
      p_request_id: id, p_decision: decision, p_notes: null,
    });
    setBusyId(null);
    if (reviewError) { setError(`Could not ${verb} request: ${reviewError.message}`); return; }
    setNotice(`Request ${decision}.`);
    await load();
  }


  return <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-10">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Platform management</p><h1 className="mt-2 text-3xl font-semibold text-deep">Organisation requests</h1><p className="mt-2 text-muted">Review organisation registration requests and manage their decisions.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-brand-text hover:bg-mint disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh</button>
    </header>
    {error && <div role="alert" className="rounded-lg border border-rose-text/30 bg-rose-bg p-4 text-rose-text">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-line bg-mint-soft p-4 text-brand-text">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      {tabs.map(tab => <button key={tab.id} onClick={() => setStatus(tab.id)} className={`rounded-xl border p-4 text-left transition ${status === tab.id ? 'border-brand bg-mint text-brand-text' : 'border-line bg-white hover:bg-mint-soft'}`}><span className="text-sm text-muted">{tab.label}</span><span className="mt-1 block text-2xl font-semibold text-deep">{counts[tab.id]}</span></button>)}
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line p-5"><ClipboardList size={18} className="text-brand"/><h2 className="text-lg font-semibold text-deep">{tabs.find(t => t.id === status)?.label} requests</h2></div>
      {loading ? <p className="p-6 text-muted">Loading requests…</p> : rows.length === 0 ? <p className="p-6 text-muted">No {status} requests found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Organisation</th><th className="p-4">Type</th><th className="p-4">Location</th><th className="p-4">Submitted</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-line"><td className="p-4"><p className="font-medium text-deep">{row.organisation_name || '—'}</p><p className="text-muted">{row.email || '—'}</p></td><td className="p-4">{row.type || '—'}</td><td className="p-4">{[row.city_town, row.province_state, row.country].filter(Boolean).join(', ') || '—'}</td><td className="p-4">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</td><td className="p-4 capitalize">{row.status.replace('_', ' ')}</td><td className="p-4">{row.status === 'pending' ? <div className="flex flex-wrap gap-2"><button disabled={busyId === row.id} onClick={() => void review(row.id, 'approved')} className="rounded-lg bg-ink px-3 py-1.5 text-white disabled:opacity-50">Approve</button><button disabled={busyId === row.id} onClick={() => void review(row.id, 'rejected')} className="rounded-lg border border-line px-3 py-1.5 text-deep disabled:opacity-50">Reject</button></div> : <span className="text-muted">—</span>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
