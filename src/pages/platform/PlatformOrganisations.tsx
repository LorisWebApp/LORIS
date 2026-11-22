import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';

type Organisation = Record<string, unknown> & { id: number };

/** Platform Manager: list of registered (approved) organisations. Read-only; approval happens in Requests. */
export default function PlatformOrganisations() {
  const [rows, setRows] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error: e } = await supabase.from('Organisation').select('*').order('id', { ascending: false });
    if (e) setError(`Could not load organisations: ${e.message}`); else setRows((data ?? []) as Organisation[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const shown = rows.filter((o) => !query.trim() || [o['organisation name'], o.email, o.type, o.country, o['city/town']].some((v) => String(v ?? '').toLowerCase().includes(query.trim().toLowerCase())));
  return <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Platform management</p><h1 className="mt-2 text-4xl font-semibold text-deep">Organisations</h1><p className="mt-2 text-muted">Organisations registered on LORIS.</p></div>
      <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-mint"><RefreshCw size={16} /> Refresh</button>
    </header>
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search organisations" aria-label="Search organisations" className="w-full max-w-md rounded-lg border border-line bg-white px-3 py-2" />
    {error && <div role="alert" className="rounded-lg border border-rose-text/30 bg-rose-bg p-4 text-rose-text">{error}</div>}
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      {loading ? <p className="p-6 text-muted">Loading…</p> : shown.length === 0 ? <p className="p-6 text-muted">{rows.length ? 'No organisations match your search.' : 'No organisations have been approved yet.'}</p> :
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-mint-soft text-brand-text"><tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Email</th><th className="p-4">Location</th></tr></thead>
          <tbody>{shown.map((o) => <tr key={o.id} className="border-t border-line"><td className="p-4">{String(o['organisation name'] ?? '—')}</td><td className="p-4">{String(o.type ?? '—')}</td><td className="p-4">{String(o.email ?? '—')}</td><td className="p-4">{[o['city/town'], o['province/state'], o.country].filter(Boolean).map(String).join(', ') || '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
