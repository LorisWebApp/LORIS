import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Controlled viewers. Content is rendered by LORIS (canvas / hardened media elements),
 * never by the browser's native PDF/media UI, so no download/print/save controls exist.
 * This deters ordinary copying and saving; it is not DRM (screenshots/devtools remain possible).
 */
const block = (e: { preventDefault: () => void }) => e.preventDefault();

export function ProtectedPdfViewer({ blob }: { blob: Blob }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (cancelled) { void doc.destroy(); return; }
        docRef.current = doc; setPages(doc.numPages); setPage(1);
      } catch { if (!cancelled) setError('This PDF could not be displayed.'); }
    })();
    return () => { cancelled = true; void docRef.current?.destroy(); docRef.current = null; };
  }, [blob]);

  useEffect(() => {
    const doc = docRef.current; const canvas = canvasRef.current;
    if (!doc || !canvas || !pages) return;
    let task: pdfjs.RenderTask | null = null; let cancelled = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        const vp = p.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.style.width = `${vp.width / (window.devicePixelRatio || 1)}px`;
        task = p.render({ canvasContext: canvas.getContext('2d')!, viewport: vp });
        await task.promise;
      } catch (e) { if (!cancelled && (e as Error).name !== 'RenderingCancelledException') setError('A page could not be rendered.'); }
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [page, scale, pages]);

  const btn = 'inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm hover:bg-mint disabled:opacity-40';
  if (error) return <p role="alert" className="p-6 text-rose-text">{error}</p>;
  return (
    <div className="flex h-full w-full flex-col" onContextMenu={block} onDragStart={block}>
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-line bg-white p-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /> Prev</button>
        <span className="text-sm" aria-live="polite">Page {pages ? page : '–'} of {pages || '–'}</span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">Next <ChevronRight size={16} /></button>
        <button type="button" className={btn} onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))} aria-label="Zoom out"><ZoomOut size={16} /></button>
        <button type="button" className={btn} onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))} aria-label="Zoom in"><ZoomIn size={16} /></button>
      </div>
      <div className="flex-1 overflow-auto bg-neutral-200 p-4 select-none" style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}>
        <canvas ref={canvasRef} className="mx-auto block max-w-none bg-white shadow" draggable={false} />
      </div>
    </div>
  );
}

export function ProtectedMedia({ kind, blob, title }: { kind: 'audio' | 'video' | 'image'; blob: Blob; title: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  if (!url) return null;
  const common = { onContextMenu: block, onDragStart: block, draggable: false } as const;
  if (kind === 'image') return <img src={url} alt={title} {...common} className="max-h-full max-w-full object-contain select-none pointer-events-none" />;
  if (kind === 'video') return <video src={url} controls autoPlay playsInline controlsList="nodownload noremoteplayback" disablePictureInPicture {...common} className="w-full max-h-[80vh] bg-black" />;
  return <audio src={url} controls autoPlay controlsList="nodownload noremoteplayback" {...common} className="w-full" />;
}
