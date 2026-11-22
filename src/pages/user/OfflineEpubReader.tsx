import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { getOfflineMaterial } from '../../group-d/offline/offlineMaterials';


export default function OfflineEpubReader() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<ReturnType<typeof ePub> | null>(null);
  const renditionRef = useRef<ReturnType<ReturnType<typeof ePub>['renderTo']> | null>(null);
  const [title, setTitle] = useState('Offline EPUB');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const record = await getOfflineMaterial(id);
        if (!record) throw new Error('This EPUB is not stored on this device.');
        if (cancelled) return;
        setTitle(record.metadata.title || 'Offline EPUB');
        const book = ePub(await record.fileBlob.arrayBuffer());
        bookRef.current = book;
        if (!containerRef.current) throw new Error('The EPUB reader area could not be initialized.');
        const rendition = book.renderTo(containerRef.current, { width: '100%', height: '100%', flow: 'paginated', spread: 'none' });
        renditionRef.current = rendition;
        await rendition.display();
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Unable to open the offline EPUB.'); setLoading(false); }
      }
    };
    void load();
    return () => { cancelled = true; renditionRef.current?.destroy(); bookRef.current?.destroy(); renditionRef.current = null; bookRef.current = null; };
  }, [id]);


  const previous = () => { void renditionRef.current?.prev().catch((err: unknown) => console.error('EPUB previous page failed', err)); };
  const next = () => { void renditionRef.current?.next().catch((err: unknown) => console.error('EPUB next page failed', err)); };

  return <div className="min-h-screen bg-page text-deep flex flex-col">
    <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-3"><BookOpen className="shrink-0 text-brand"/><h1 className="truncate text-lg font-semibold">{title}</h1><span className="hidden rounded-full bg-mint px-2 py-1 text-xs font-semibold text-brand-text sm:inline">Offline</span></div>
      <button type="button" onClick={() => navigate('/offline-library')} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-mint" aria-label="Close EPUB reader"><X size={16}/> Close</button>
    </header>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-4 sm:px-6">
      {loading && <p className="grid min-h-[60vh] place-items-center text-muted">Loading offline book…</p>}
      {error && <div role="alert" className="mx-auto mt-12 max-w-xl rounded-xl border border-rose-text/30 bg-rose-bg p-5 text-rose-text"><h2 className="font-semibold">Could not open EPUB</h2><p className="mt-2">{error}</p><button onClick={() => navigate('/offline-library')} className="mt-4 rounded-lg border border-current px-3 py-2 text-sm">Return to Offline Library</button></div>}
      <div ref={containerRef} className="min-h-[60vh] flex-1 rounded-xl border border-line bg-white shadow-sm" style={{ display: loading || error ? 'none' : 'block' }}/>
      {!loading && !error && <div className="flex justify-center gap-3 py-4"><button onClick={previous} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm hover:bg-mint"><ChevronLeft size={16}/> Previous</button><button onClick={next} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm hover:bg-mint">Next <ChevronRight size={16}/></button></div>}
    </main>
  </div>;
}
