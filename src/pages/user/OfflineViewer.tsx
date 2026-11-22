import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import { getOfflineMaterial } from '../../group-d/offline/offlineMaterials';
import { ProtectedMedia, ProtectedPdfViewer } from '../../components/reader/ProtectedViewer';

/** In-app viewer for non-EPUB offline materials (replaces opening raw blob URLs in the native viewer). */
export default function OfflineViewer() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<{ blob: Blob; title: string; mime: string; name: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    getOfflineMaterial(id).then((r) => {
      if (off) return;
      if (!r) setError('This material is not stored on this device.');
      else setState({ blob: r.fileBlob, title: r.metadata.title, mime: (r.metadata.mimeType || '').toLowerCase(), name: (r.metadata.fileName || '').toLowerCase() });
    }).catch((e: unknown) => { if (!off) setError(e instanceof Error ? e.message : 'Unable to open this material.'); });
    return () => { off = true; };
  }, [id]);
  const is = (s: string, ext: RegExp) => state && (state.mime.includes(s) || ext.test(state.name));
  return (
    <div className="flex min-h-screen flex-col bg-page text-deep">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3"><BookOpen className="shrink-0 text-brand" /><h1 className="truncate text-lg font-semibold">{state?.title ?? 'Offline material'}</h1></div>
        <button type="button" onClick={() => navigate('/offline-library')} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-mint" aria-label="Close viewer"><X size={16} /> Close</button>
      </header>
      <main className="flex flex-1 flex-col" style={{ minHeight: '70vh' }}>
        {error && <p role="alert" className="m-8 text-rose-text">{error}</p>}
        {!error && !state && <p className="m-8 text-muted">Loading…</p>}
        {state && (is('pdf', /\.pdf$/) ? <ProtectedPdfViewer blob={state.blob} />
          : is('video', /\.mp4$/) ? <ProtectedMedia kind="video" blob={state.blob} title={state.title} />
          : is('audio', /\.mp3$/) ? <div className="m-8"><ProtectedMedia kind="audio" blob={state.blob} title={state.title} /></div>
          : is('image', /\.(jpe?g|png|gif|webp)$/) ? <div className="flex flex-1 items-center justify-center p-4"><ProtectedMedia kind="image" blob={state.blob} title={state.title} /></div>
          : <p className="m-8 text-muted">This file type cannot be displayed in LORIS.</p>)}
      </main>
    </div>
  );
}
