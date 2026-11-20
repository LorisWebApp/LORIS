import { useCallback, useEffect, useState } from 'react';
import { Building2, ClipboardList, Users } from 'lucide-react';
import { decideOrganisationRequest, getPlatformDashboard, sendOrganisationDecisionEmail } from '../../services/platform.service';

type Organisation = Record<string, unknown> & { id: number };
type RequestRow = Record<string, unknown> & { id: string; status: string };

export default function PlatformDashboard() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [requestTotal, setRequestTotal] = useState(0);
  const [orgTotal, setOrgTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getPlatformDashboard();
      setOrganisations(data.organisations);
      setOrgTotal(data.organisationTotal);
      setRequests(data.requests);
      setRequestTotal(data.requestTotal);
      setPendingTotal(data.pendingTotal);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load platform dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, decision: 'approved' | 'rejected') {
    const label = decision === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${label} this organisation request?`)) return;
    setBusyId(id); setNotice(''); setError('');
    try {
      await decideOrganisationRequest(id, decision);
      let emailNote = '';
      try {
        const emailResult = await sendOrganisationDecisionEmail(id);
        emailNote = emailResult.sent ? ' The applicant has been emailed.' : ` The email was not sent${emailResult.reason ? `: ${emailResult.reason}` : '.'}`;
      } catch {
        emailNote = ' The email could not be sent (server unreachable).';
      }
      setNotice(`Request ${decision}.${emailNote}`);
      await load();
    } catch (reviewError) {
      setError(`Could not ${label} the request: ${reviewError instanceof Error ? reviewError.message : 'Please try again.'}`);
    } finally {
      setBusyId(null);
    }
  }
  return <div className="mx-auto max-w-[1500px] space-y-8 p-6 lg:p-10">
    <header><p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Platform management</p><h1 className="mt-2 text-4xl font-semibold text-deep">Platform dashboard</h1><p className="mt-2 text-muted">A live overview of LORIS organisations and registration requests.</p></header>
    {error && <div role="alert" className="rounded-lg border border-rose-text/30 bg-rose-bg p-4 text-rose-text">{error}<p className="mt-1 text-sm">If a table or function is missing, review and apply the additive migrations in database/migrations first.</p></div>}
    {notice && <div role="status" className="rounded-lg border border-line bg-mint-soft p-4 text-brand-text">{notice}</div>}
    <section className="grid gap-4 md:grid-cols-3">
      {[{label:'Organisations',value:orgTotal,Icon:Building2},{label:'Registration requests',value:requestTotal,Icon:ClipboardList},{label:'Pending review',value:pendingTotal,Icon:Users}].map(({label,value,Icon})=><article key={label} className="rounded-xl border border-line bg-white p-6"><Icon className="text-brand"/><p className="mt-4 text-sm text-muted">{label}</p><p className="mt-1 text-3xl font-semibold">{loading?'—':value}</p></article>)}
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="text-xl font-semibold">Recent organisation registrations</h2></div>{loading?<p className="p-6 text-muted">Loading…</p>:requests.length===0?<p className="p-6 text-muted">No registration requests found. If the requests table has not been created yet, apply the reviewed migration first.</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Organisation</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Submitted</th><th className="p-4">Action</th></tr></thead><tbody>{requests.map((r)=><tr key={r.id} className="border-t border-line"><td className="p-4">{String(r.organisation_name??'—')}</td><td className="p-4">{String(r.email??'—')}</td><td className="p-4 capitalize">{r.status}</td><td className="p-4">{String(r.created_at??'—')}</td><td className="p-4">{r.status==='pending'?<span className="flex gap-2"><button disabled={busyId===r.id} onClick={()=>void review(r.id,'approved')} className="rounded-lg bg-ink px-3 py-1.5 text-white disabled:opacity-50">Approve</button><button disabled={busyId===r.id} onClick={()=>void review(r.id,'rejected')} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50">Reject</button></span>:<span className="text-muted">—</span>}</td></tr>)}</tbody></table></div>}</section>
    <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="text-xl font-semibold">Organisations</h2></div>{loading?<p className="p-6 text-muted">Loading…</p>:organisations.length===0?<p className="p-6 text-muted">No organisations have been approved yet.</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Email</th><th className="p-4">Location</th></tr></thead><tbody>{organisations.map((o)=><tr key={o.id} className="border-t border-line"><td className="p-4">{String(o['organisation name']??'—')}</td><td className="p-4">{String(o.type??'—')}</td><td className="p-4">{String(o.email??'—')}</td><td className="p-4">{[o['city/town'],o['province/state'],o.country].filter(Boolean).map(String).join(', ')||'—'}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
