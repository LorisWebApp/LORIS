import { Bookmark, ChevronRight, Grid2x2, LayoutList, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { sortLabels, type LibraryFilters, type SortKey } from '../../hooks/useLibraryFilters';
import { formatBytes, formatDayTime, formatSavedAgo } from '../../lib/format';
import { getMaterialKind, isAccessValid, type FormatFilter } from '../../types/offline';
import { ROUTES } from '../../integration/loris';
import { TopNav } from '../layout/TopNav';
import { SiteFooter } from '../layout/SiteFooter';
import { CoverArt, CoverOverlayIcon } from './CoverArt';
import { actionFor, fileInfo, kindBadge } from './materialDisplay';
import { EmptyState, ErrorState, LoadingGrid } from './StateViews';
import { SyncStatus, VerifiedIcon } from './StatusBits';

type Lib = ReturnType<typeof useOfflineLibrary>;
interface Props {
  lib: Lib;
  f: LibraryFilters;
  onOpen: (id: string) => void;
  onRemove: (m: OfflineMaterialMetadata) => void;
  onPurge: () => void;
}

const pillFormats: { key: FormatFilter; label: string }[] = [
  { key: 'all', label: 'All Materials' },
  { key: 'epub', label: 'E-Books' },
  { key: 'pdf', label: 'Documents' },
  { key: 'audio', label: 'Audiobooks' },
  { key: 'video', label: 'Lectures' },
];
const checkFormats: { key: FormatFilter; label: string }[] = [
  { key: 'all', label: 'All Formats' },
  { key: 'epub', label: 'E-Books (EPUB)' },
  { key: 'pdf', label: 'Documents (PDF)' },
  { key: 'audio', label: 'Audio (MP3)' },
  { key: 'video', label: 'Video (MP4)' },
];

function VaultVolume({ lib, onPurge }: { lib: Lib; onPurge: () => void }) {
  const { storage, readyCount, items } = lib;
  const { usedBytes, quotaBytes, byKind } = storage;
  const pct = quotaBytes ? (usedBytes / quotaBytes) * 100 : 0;
  const seg = (n: number) => (n > 0 && quotaBytes ? Math.max((n / quotaBytes) * 100, 1.5) : 0);
  const used = formatBytes(usedBytes);
  const [num, unit] = used.split(' ');
  return (
    <div className="w-[400px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-white backdrop-blur">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>Vault Volume</span>
        <span className="rounded-full bg-badge px-2.5 py-0.5 text-[11px] font-semibold text-ink">{readyCount} Items Ready</span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[34px] leading-none">{num}</span>
          <span className="text-xs text-white/50">{unit}{quotaBytes ? ` / ${formatBytes(quotaBytes)}` : ' on device'}</span>
        </div>
        {quotaBytes ? <span className="text-xs font-semibold text-badge">{pct < 0.1 && usedBytes ? '<0.1' : pct.toFixed(1)}% capacity</span> : null}
      </div>
      <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/20" aria-hidden>
        <span className="bg-badge" style={{ width: `${seg(byKind.epub)}%` }} />
        <span className="bg-[#7fd9c8]" style={{ width: `${seg(byKind.pdf)}%` }} />
        <span className="bg-[#c4d8d4]" style={{ width: `${seg(byKind.media)}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/60">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-badge" />EPUB</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#7fd9c8]" />PDF</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#c4d8d4]" />Audio/Video</span>
        <button onClick={onPurge} disabled={items.length === 0} className="font-semibold text-white/80 hover:text-white disabled:opacity-40">Purge</button>
      </div>
    </div>
  );
}

function Hero({ lib, onPurge }: { lib: Lib; onPurge: () => void }) {
  return (
    <section className="bg-[linear-gradient(120deg,#092f2c_40%,#0b3a36)] text-white">
      <div className="mx-auto flex max-w-[1312px] items-center justify-between gap-10 px-8 pb-12 pt-10">
        <div className="max-w-[640px]">
          <p className="text-[11px] text-white/60">Library Vault <ChevronRight size={10} className="inline" /> <span className="font-semibold text-white">Offline Library</span></p>
          <span className="mt-8 block h-px w-8 bg-badge" />
          <h1 className="mt-3 font-serif text-5xl leading-none">Offline Library</h1>
          <p className="mt-5 text-[15px] leading-7 text-white/75">
            Access your saved manuscripts, academic journals, and spoken recordings without network connectivity.
            In-line annotations, highlights, and bookmarks sync automatically upon reconnecting.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/65">
            <span className="inline-flex items-center gap-1.5"><VerifiedIcon />Last verified: {lib.lastVerifiedAt ? formatDayTime(lib.lastVerifiedAt) : '—'}</span>
            <span className="opacity-40">•</span>
            <SyncStatus lib={lib} />
          </div>
        </div>
        <VaultVolume lib={lib} onPurge={onPurge} />
      </div>
    </section>
  );
}

function Sidebar({ lib, f }: { lib: Lib; f: LibraryFilters }) {
  const soonest = lib.items.map((m) => new Date(m.offlineAllowedUntil).getTime()).sort((a, b) => a - b)[0];
  const days = soonest ? Math.max(0, Math.ceil((soonest - Date.now()) / 86_400_000)) : null;
  return (
    <aside className="w-[300px] shrink-0 space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10"><ShieldCheck size={18} /></span>
          <div>
            <p className="text-sm font-semibold">{lib.status === 'error' ? 'Offline Node Unavailable' : 'Offline Node Active'}</p>
            <p className="text-[11px] text-white/60">Stored on this device</p>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-5 text-white/70">
          {days === null
            ? 'Saved works stay available offline until their access expiry.'
            : `Saved works stay available offline until their access expiry — the next is in ${days} day${days === 1 ? '' : 's'}.`}
        </p>
        <p className="mt-4 flex items-center justify-between text-[12px] font-semibold">
          <span>Storage Health: {lib.healthPercent}%</span>
          <ShieldCheck size={14} className="text-badge" />
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[17px] text-deep">Vault Filters</h2>
          <button onClick={f.reset} className="text-[11px] font-semibold text-ink/70 hover:text-ink">Reset All</button>
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-muted">Document Format</p>
        <ul className="mt-3 space-y-3">
          {checkFormats.map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 text-[13px] text-deep">
                <input type="checkbox" checked={f.format === key} onChange={() => f.setFormat(f.format === key ? 'all' : key)} className="size-4 accent-ink" />
                <span className="flex-1">{label}</span>
                <span className="text-[11px] text-muted">{f.formatCounts[key]}</span>
              </label>
            </li>
          ))}
        </ul>
        <hr className="my-5 border-line" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Subject Area</p>
        <ul className="mt-3 space-y-3">
          {f.subjectCounts.length === 0 && <li className="text-[12px] text-muted">No subjects yet</li>}
          {f.subjectCounts.map(([name, count]) => (
            <li key={name}>
              <label className="flex cursor-pointer items-center gap-3 text-[13px] text-deep">
                <input type="checkbox" checked={f.subjects.includes(name)} onChange={() => f.toggleSubject(name)} className="size-4 accent-ink" />
                <span className="flex-1">{name}</span>
                <span className="text-[11px] text-muted">{count}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Toolbar({ f }: { f: LibraryFilters }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex items-center gap-4">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-mint px-4 py-2.5">
          <Search size={14} className="text-muted" />
          <input value={f.query} onChange={(e) => f.setQuery(e.target.value)} placeholder="Search saved materials, authors, topics..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted" />
        </label>
        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Sort:
          <select value={f.sort} onChange={(e) => f.setSort(e.target.value as SortKey)} className="rounded-full bg-mint px-4 py-2.5 text-xs font-semibold normal-case tracking-normal text-deep outline-none">
            {(Object.keys(sortLabels) as SortKey[]).map((k) => <option key={k} value={k}>{sortLabels[k]}</option>)}
          </select>
        </label>
        <div className="flex gap-1 rounded-full bg-mint p-1">
          {([['grid', Grid2x2, 'Grid view'], ['list', LayoutList, 'List view']] as const).map(([v, Icon, label]) => (
            <button key={v} aria-label={label} aria-pressed={f.view === v} onClick={() => f.setView(v)} className={`grid size-8 place-items-center rounded-full ${f.view === v ? 'bg-ink text-white' : 'text-ink/60'}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
      <hr className="my-4 border-line" />
      <div className="flex flex-wrap gap-2">
        {pillFormats.map(({ key, label }) => (
          <button key={key} onClick={() => f.setFormat(key)} className={`rounded-full px-4 py-1.5 text-[11px] font-semibold ${f.format === key ? 'bg-deep text-white' : 'bg-mint text-ink/80 hover:bg-badge/60'}`}>
            {label} ({f.formatCounts[key]})
          </button>
        ))}
      </div>
    </div>
  );
}

function Card({ m, onOpen, onRemove }: { m: OfflineMaterialMetadata; onOpen: Props['onOpen']; onRemove: Props['onRemove'] }) {
  const kind = getMaterialKind(m);
  const { desktop, Icon } = actionFor[kind];
  const valid = isAccessValid(m);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(9,47,44,0.04)]">
      <div className="relative h-[232px] shrink-0 overflow-hidden">
        <CoverArt m={m} />
        <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-white text-ink"><Bookmark size={13} fill="currentColor" /></span>
        <CoverOverlayIcon m={m} />
        {m.category && <span className="absolute bottom-3 left-3 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">{m.category}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${kind === 'pdf' ? 'bg-rose-bg text-rose-text' : 'bg-badge text-brand-text'}`}>{kindBadge[kind]}</span>
          {fileInfo(m)}
        </p>
        <h3 className="mt-2 font-serif text-[17px] font-semibold leading-snug text-deep">{m.title}</h3>
        {m.author && <p className="mt-1 text-xs text-muted">{m.author}</p>}
        <p className={`mt-3 flex items-start gap-1.5 text-[11px] font-semibold ${valid ? 'text-brand' : 'text-rose-text'}`}>
          <i className={`mt-1 size-1.5 shrink-0 rounded-full ${valid ? 'bg-brand' : 'bg-rose-text'}`} />
          {valid ? 'Downloaded & Ready' : 'Offline access expired'} • Saved {formatSavedAgo(m.savedAt)}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <button onClick={() => onOpen(m.id)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-deep text-xs font-semibold text-white hover:bg-ink">
            <Icon size={13} /> {desktop}
          </button>
          <button aria-label={`Remove ${m.title}`} onClick={() => onRemove(m)} className="grid size-9 place-items-center rounded-full bg-mint text-ink/60 hover:text-rose-text">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ListRow({ m, onOpen, onRemove }: { m: OfflineMaterialMetadata; onOpen: Props['onOpen']; onRemove: Props['onRemove'] }) {
  const kind = getMaterialKind(m);
  const { desktop, Icon } = actionFor[kind];
  const valid = isAccessValid(m);
  return (
    <article className="flex items-center gap-5 rounded-2xl bg-white p-4">
      <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-xl"><CoverArt m={m} /></div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${kind === 'pdf' ? 'bg-rose-bg text-rose-text' : 'bg-badge text-brand-text'}`}>{kindBadge[kind]}</span>
          {fileInfo(m)}{m.category ? ` • ${m.category}` : ''}
        </p>
        <h3 className="mt-1 truncate font-serif text-[17px] font-semibold text-deep">{m.title}</h3>
        <p className="text-xs text-muted">{m.author}</p>
        <p className={`mt-1 text-[11px] font-semibold ${valid ? 'text-brand' : 'text-rose-text'}`}>{valid ? 'Downloaded & Ready' : 'Offline access expired'} • Saved {formatSavedAgo(m.savedAt)}</p>
      </div>
      <button onClick={() => onOpen(m.id)} className="flex h-9 items-center gap-1.5 rounded-full bg-deep px-5 text-xs font-semibold text-white"><Icon size={13} /> {desktop}</button>
      <button aria-label={`Remove ${m.title}`} onClick={() => onRemove(m)} className="grid size-9 place-items-center rounded-full bg-mint text-ink/60 hover:text-rose-text"><Trash2 size={14} /></button>
    </article>
  );
}

function Pagination({ f }: { f: LibraryFilters }) {
  const btn = 'rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5">
      <button className={`${btn} bg-mint text-ink/70`} disabled={f.page <= 1} onClick={() => f.setPage(f.page - 1)}>Previous</button>
      {Array.from({ length: f.pageCount }, (_, i) => i + 1).map((n) => (
        <button key={n} aria-current={n === f.page} onClick={() => f.setPage(n)} className={`${btn} ${n === f.page ? 'bg-deep text-white' : 'bg-mint text-ink/70'}`}>{n}</button>
      ))}
      <button className={`${btn} bg-mint text-ink/70`} disabled={f.page >= f.pageCount} onClick={() => f.setPage(f.page + 1)}>Next</button>
    </nav>
  );
}

export function OfflineDesktop({ lib, f, onOpen, onRemove, onPurge }: Props) {
  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <Hero lib={lib} onPurge={onPurge} />
      <div className="mx-auto flex max-w-[1312px] items-start gap-8 px-8 pt-10">
        <Sidebar lib={lib} f={f} />
        <div className="min-w-0 flex-1 space-y-6">
          <Toolbar f={f} />
          {lib.status === 'loading' && <LoadingGrid list={f.view === 'list'} />}
          {lib.status === 'error' && <ErrorState message={lib.error ?? 'Unknown error'} onRetry={lib.refresh} />}
          {lib.status === 'ready' && f.filtered.length === 0 && <EmptyState filtered={lib.items.length > 0} onReset={f.reset} />}
          {lib.status === 'ready' && f.filtered.length > 0 && (
            <>
              {f.view === 'grid' ? (
                <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
                  {f.paged.map((m) => <Card key={m.id} m={m} onOpen={onOpen} onRemove={onRemove} />)}
                </div>
              ) : (
                <div className="space-y-3">{f.paged.map((m) => <ListRow key={m.id} m={m} onOpen={onOpen} onRemove={onRemove} />)}</div>
              )}
              <Pagination f={f} />
            </>
          )}
          <section className="relative overflow-hidden rounded-2xl bg-deep p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(176,239,229,0.12),transparent_55%)]" />
            <div className="relative flex items-center justify-between gap-6">
              <div className="max-w-md">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-badge">Continue Discovery</p>
                <h2 className="mt-2 font-serif text-3xl">Expand your travelling repository</h2>
                <p className="mt-2 text-xs leading-5 text-white/65">Traveling to field research or remote sites? Queue multiple books, papers, or audio archives for bulk offline syncing with one click.</p>
              </div>
              <Link to={ROUTES.browse} className="shrink-0 rounded-full bg-badge px-5 py-2.5 text-xs font-semibold text-ink">Explore Full Catalogue</Link>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
