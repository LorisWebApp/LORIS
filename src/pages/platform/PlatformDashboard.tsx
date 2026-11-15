import { useEffect, useState } from 'react';
import { Building2, ClipboardList, Users } from 'lucide-react';
import { supabase } from '../../services/supabase';

type Organisation = Record<string, unknown> & { id: number };
type RequestRow = Record<string, unknown> & { id: string; status: string };

export default function PlatformDashboard() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    (async () => {
      const [orgResult, requestResult] = await Promise.all([
        supabase.from('Organisation').select('*').order('id', { ascending: false }),
        supabase.from('organisation_requests').select('*').order('created_at', { ascending: false }).limit(10),
      ]);
      if (!live) return;
      if (orgResult.error) setError(`Organisation records: ${orgResult.error.message}`);
      else setOrganisations((orgResult.data ?? []) as Organisation[]);
      if (requestResult.error) setError((old) => [old, `Registration requests: ${requestResult.error.message}`].filter(Boolean).join(' | '));
      else setRequests((requestResult.data ?? []) as RequestRow[]);
      setLoading(false);
    })();
    return () => { live = false; };
  }, []);
  const pending = requests.filter((r) => r.status === 'pending').length;
  return <div className="mx-auto max-w-[1500px] space-y-8 p-6 lg:p-10">
    <header><p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Platform management</p><h1 className="mt-2 text-4xl font-semibold text-deep">Platform dashboard</h1><p className="mt-2 text-muted">A live overview of LORIS organisations and registration requests.</p></header>
    {error && <div role="alert" className="rounded-lg border border-rose-text/30 bg-rose-bg p-4 text-rose-text">{error}<p className="mt-1 text-sm">If organisation_requests is missing, review and apply the additive migration in database/migrations before using registration review.</p></div>}
    <section className="grid gap-4 md:grid-cols-3">
      {[{label:'Organisations',value:organisations.length,Icon:Building2},{label:'Registration requests',value:requests.length,Icon:ClipboardList},{label:'Pending review',value:pending,Icon:Users}].map(({label,value,Icon})=><article key={label} className="rounded-xl border border-line bg-white p-6"><Icon className="text-brand"/><p className="mt-4 text-sm text-muted">{label}</p><p className="mt-1 text-3xl font-semibold">{loading?'—':value}</p></article>)}
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="border-b border-line p-5"><h2 className="text-xl font-semibold">Recent organisation registrations</h2></div>{loading?<p className="p-6 text-muted">Loading…</p>:requests.length===0?<p className="p-6 text-muted">No registration requests found. If the requests table has not been created yet, apply the reviewed migration first.</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Organisation</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Submitted</th></tr></thead><tbody>{requests.map((r)=><tr key={r.id} className="border-t border-line"><td className="p-4">{String(r.organisation_name??'—')}</td><td className="p-4">{String(r.email??'—')}</td><td className="p-4 capitalize">{r.status}</td><td className="p-4">{String(r.created_at??'—')}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
