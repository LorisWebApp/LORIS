import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import { Button, Modal, DetailRow, Pagination } from '../../components/shared';
import { supabase } from '../../services/supabase';
import { toHttps } from '../../lib/secureUrl';

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
  review_notes?: string | null;
  reviewed_at?: string | null;
};

const tabs: { id: RequestStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];


const PAGE_SIZE = 10;

export default function OrganisationRequests() {
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [rows, setRows] = useState<OrganisationRequest[]>([]);
  const [counts, setCounts] = useState<Record<RequestStatus, number>>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [q, setQ] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<OrganisationRequest | null>(null);
  const [decision, setDecision] = useState<{ row: OrganisationRequest; kind: 'approved' | 'rejected' } | null>(null);
  const [notes, setNotes] = useState('');
  const [decisionError, setDecisionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [list, pending, approved, rejected] = await Promise.all([
      supabase.from('organisation_requests').select('*').eq('status', status).order('created_at', { ascending: !newestFirst }),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('organisation_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    const problems = [list.error, pending.error, approved.error, rejected.error].filter(Boolean).map((e) => e!.message);
    if (problems.length) setError(problems.join(' | '));
    if (!list.error) setRows((list.data ?? []) as OrganisationRequest[]);
    setCounts({ pending: pending.count ?? 0, approved: approved.count ?? 0, rejected: rejected.count ?? 0 });
    setLoading(false);
  }, [status, newestFirst]);
  useEffect(() => { void load(); }, [load]);

  const filtered = rows.filter((r) => !q.trim() || [r.organisation_name, r.email, r.country, r.city_town].some((v) => String(v ?? '').toLowerCase().includes(q.trim().toLowerCase())));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDecision = (row: OrganisationRequest, kind: 'approved' | 'rejected') => { setNotes(''); setDecisionError(''); setDecision({ row, kind }); };

  async function confirmDecision() {
    if (!decision) return;
    const { row, kind } = decision;
    if (busyId) return; // prevents duplicate submissions
    if (kind === 'rejected' && !notes.trim()) { setDecisionError('Please give the applicant a reason for rejection.'); return; }
    setBusyId(row.id); setDecisionError('');
    const { error: reviewError } = await supabase.rpc('loris_review_organisation_request', { p_request_id: row.id, p_decision: kind, p_notes: notes.trim() || null });
    if (reviewError) { setBusyId(null); setDecisionError(reviewError.message); await load(); return; }
    // The decision is saved at this point; a failed email is reported but not fatal.
    let emailNote = '';
    try {
      const { data: session } = await supabase.auth.getSession();
      const base = toHttps(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, ''));
      const response = await fetch(`${base}/api/notifications/organisation-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session?.access_token ?? ''}` },
        body: JSON.stringify({ requestId: row.id }),
      });
      const body = await response.json().catch(() => ({})) as { sent?: boolean; reason?: string };
      emailNote = body.sent ? ' Applicant notified by email.' : ` Email not sent${body.reason ? `: ${body.reason}` : '.'}`;
    } catch { emailNote = ' Email notification could not be sent (server unavailable).'; }
    setBusyId(null); setDecision(null); setDetail(null);
    setNotice(`${row.organisation_name} ${kind}.${kind === 'approved' ? ' The organisation has been created and the applicant is its administrator.' : ''}${emailNote}`);
    await load();
  }

  const statusBadge = (st: RequestStatus) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${st === 'approved' ? 'bg-mint text-brand-text' : st === 'rejected' ? 'bg-rose-bg text-rose-text' : 'bg-amber-100 text-amber-800'}`}>{st}</span>;

  return <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-10">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Platform management</p><h1 className="mt-2 text-3xl font-semibold text-deep">Organisation requests</h1><p className="mt-2 text-muted">Review organisation registration requests and manage their decisions.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-brand-text hover:bg-mint disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </header>
    {error && <div role="alert" className="rounded-lg border border-rose-text/30 bg-rose-bg p-4 text-rose-text">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-line bg-mint-soft p-4 text-brand-text">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      {tabs.map((tab) => <button type="button" key={tab.id} onClick={() => { setStatus(tab.id); setPage(1); }} className={`rounded-xl border p-4 text-left transition ${status === tab.id ? 'border-brand bg-mint text-brand-text' : 'border-line bg-white hover:bg-mint-soft'}`}><span className="text-sm text-muted">{tab.label}</span><span className="mt-1 block text-2xl font-semibold text-deep">{counts[tab.id]}</span></button>)}
    </section>
    <div className="flex flex-wrap items-center gap-3">
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or location" aria-label="Search requests" className="w-full max-w-sm rounded-lg border border-line bg-white px-3 py-2" />
      <button type="button" onClick={() => { setNewestFirst((v) => !v); setPage(1); }} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-mint">{newestFirst ? <ArrowDown size={14} /> : <ArrowUp size={14} />}{newestFirst ? 'Newest first' : 'Oldest first'}</button>
    </div>
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line p-5"><ClipboardList size={18} className="text-brand" /><h2 className="text-lg font-semibold text-deep">{tabs.find((t) => t.id === status)?.label} requests</h2></div>
      {loading ? <p className="p-6 text-muted">Loading requests…</p> : filtered.length === 0 ? <p className="p-6 text-muted">{q ? 'No requests match your search.' : `No ${status} requests found.`}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Organisation</th><th className="p-4">Type</th><th className="p-4">Location</th><th className="p-4">Submitted</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.id} className="border-t border-line"><td className="p-4"><p className="font-medium text-deep">{row.organisation_name || '—'}</p><p className="text-muted">{row.email || '—'}</p></td><td className="p-4">{row.type || '—'}</td><td className="p-4">{[row.city_town, row.province_state, row.country].filter(Boolean).join(', ') || '—'}</td><td className="p-4">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</td><td className="p-4">{statusBadge(row.status)}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDetail(row)} className="rounded-lg border border-line px-3 py-1.5 text-deep hover:bg-mint">Details</button>{row.status === 'pending' && <><button type="button" onClick={() => openDecision(row, 'approved')} className="rounded-lg bg-ink px-3 py-1.5 text-white">Approve</button><button type="button" onClick={() => openDecision(row, 'rejected')} className="rounded-lg border border-line px-3 py-1.5 text-deep hover:bg-rose-bg">Reject</button></>}</div></td></tr>)}</tbody></table></div>}
      {!loading && filtered.length > PAGE_SIZE && <div className="flex justify-between border-t border-line p-4 text-sm text-muted"><p>Showing {pageRows.length} of {filtered.length}</p><Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>}
    </section>

    <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.organisation_name ?? 'Request'} description="Applicant and organisation information" size="md"
      actions={detail && <>
        <Button variant="text" onClick={() => setDetail(null)}>Close</Button>
        {detail.status === 'pending' && <><Button variant="danger" onClick={() => { const r = detail; setDetail(null); openDecision(r, 'rejected'); }}>Reject</Button><Button onClick={() => { const r = detail; setDetail(null); openDecision(r, 'approved'); }}>Approve</Button></>}
      </>}>
      {detail && <div className="divide-y divide-line">
        <DetailRow label="Status" value={statusBadge(detail.status)} />
        <DetailRow label="Contact email" value={detail.email} />
        <DetailRow label="Type" value={detail.type || '—'} />
        <DetailRow label="Location" value={[detail.city_town, detail.province_state, detail.country, detail.postal_code].filter(Boolean).join(', ') || '—'} />
        <DetailRow label="Submitted" value={detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'} />
        {detail.status !== 'pending' && <DetailRow label="Reviewed" value={detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString() : '—'} />}
        {detail.review_notes && <DetailRow label="Reviewer notes" value={detail.review_notes} />}
      </div>}
    </Modal>

    <Modal open={decision !== null} onClose={() => !busyId && setDecision(null)} role="alertdialog" size="sm" dismissible={!busyId}
      title={decision?.kind === 'approved' ? 'Approve this organisation?' : 'Reject this request?'}
      description={decision ? (decision.kind === 'approved' ? `${decision.row.organisation_name} will be created and the applicant becomes its administrator.` : `${decision.row.organisation_name} will not be activated. The applicant will be told the reason.`) : ''}
      actions={<><Button variant="text" onClick={() => setDecision(null)} disabled={Boolean(busyId)}>Cancel</Button><Button variant={decision?.kind === 'rejected' ? 'danger' : 'primary'} onClick={() => void confirmDecision()} loading={Boolean(busyId)}>{decision?.kind === 'approved' ? 'Approve' : 'Reject'}</Button></>}>
      <label className="block text-sm font-medium text-deep">{decision?.kind === 'rejected' ? 'Reason for rejection (required)' : 'Note to applicant (optional)'}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} className="mt-1 w-full rounded-lg border border-line p-2 font-normal" />
      </label>
      {decisionError && <p role="alert" className="mt-2 text-sm text-rose-text">{decisionError}</p>}
    </Modal>
  </div>;
}
