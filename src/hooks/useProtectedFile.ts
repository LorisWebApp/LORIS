import { useEffect, useState } from 'react';
import { getAccessToken } from '../integration/loris';
import { toHttps } from '../lib/secureUrl';

/** Fetches a material through the authenticated API (never a public storage URL). */
export function useProtectedFile(materialId: string | undefined, enabled: boolean) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled || !materialId) return;
    const ctrl = new AbortController();
    setLoading(true); setError(''); setBlob(null);
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Sign in to view this material.');
        const base = toHttps(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, ''));
        const r = await fetch(`${base}/api/materials/${encodeURIComponent(materialId)}/file`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal });
        if (!r.ok) throw new Error(r.status === 404 ? 'This material is not available.' : 'The material could not be loaded.');
        setBlob(await r.blob());
      } catch (e) { if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : 'The material could not be loaded.'); }
      finally { if (!ctrl.signal.aborted) setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [materialId, enabled]);
  return { blob, error, loading };
}
