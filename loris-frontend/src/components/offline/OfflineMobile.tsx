import { Clock, HardDrive, Search, Sparkles, Trash2, CloudDownload, CircleCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { sortLabels, type LibraryFilters, type SortKey } from '../../hooks/useLibraryFilters';
import { formatBytes, formatBytesShort, formatSavedAgo, formatSyncedAt } from '../../lib/format';
import { getMaterialKind, isAccessValid, type FormatFilter } from '../../types/offline';
import { ROUTES } from '../../integration/loris';
import { MobileBottomNav, MobileTopBar } from '../layout/MobileChrome';
import { CoverArt } from './CoverArt';
import { actionFor, fileInfo, kindBadge } from './materialDisplay';
import { EmptyState, ErrorState, LoadingGrid } from './StateViews';
import { SyncStatus } from './StatusBits';

type Lib = ReturnType<typeof useOfflineLibrary>;
interface Props {
  lib: Lib;
  f: LibraryFilters;
  onOpen: (id: string) => void;
  onRemove: (m: OfflineMaterialMetadata) => void;
}

const pills: { key: FormatFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'epub', label: 'EPUB' },
  { key: 'pdf', label: 'PDF' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
];
const sortOrder: SortKey[] = ['recent', 'title', 'author', 'size'];
const shortSort: Record<SortKey, string> = { recent: 'Recent', title: 'A–Z', author: 'Author', size: 'Size' };

function StorageCard({ lib }: { lib: Lib }) {
  const { storage, items } = lib;
  const { usedBytes, quotaBytes, byKind } = storage;
  const w = (n: number) => (quotaBytes && n > 0 ? Math.max((n / quotaBytes) * 100, 2) : n > 0 && usedBytes ? (n / usedBytes) * 100 : 0);
  const used = formatBytes(usedBytes).split(' ');
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(9,47,44,0.06)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-mint text-ink"><HardDrive size={16} /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-deep">Storage Allocation</p>
          <p className="text-[11px] text-muted">{items.length} item{items.length === 1 ? '' : 's'} saved on device</p>
        </div>
        <p className="text-sm font-bold text-deep">{used[0]} {used[1]}<span className="font-normal text-muted">{quotaBytes ? ` / ${formatBytesShort(quotaBytes)}` : ''}</span></p>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-mint" aria-hidden>
        <span className="bg-[#3f7f78]" style={{ width: `${w(byKind.epub)}%` }} />
        <span className="bg-[#9ce0d3]" style={{ width: `${w(byKind.pdf)}%` }} />
        <span className="bg-deep" style={{ width: `${w(byKind.media)}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-semibold text-ink/70">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#3f7f78]" />EPUB ({formatBytesShort(byKind.epub)})</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#9ce0d3]" />PDF ({formatBytesShort(byKind.pdf)})</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-deep" />Media ({formatBytesShort(byKind.media)})</span>
      </div>
    </div>
  );
}

function Card({ m, onOpen, onRemove }: { m: OfflineMaterialMetadata } & Pick<Props, 'onOpen' | 'onRemove'>) {
  const kind = getMaterialKind(m);
  const { mobile, Icon } = actionFor[kind];
  const valid = isAccessValid(m);
  return (
    <article className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(9,47,44,0.05)]">
      <div className="flex gap-3">
        <div className="relative h-[110px] w-20 shrink-0 overflow-hidden rounded-xl">
          <CoverArt m={m} />
          <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-brand-text">{kindBadge[kind]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className={`inline-flex items-center gap-1 font-semibold ${valid ? 'text-brand' : 'text-rose-text'}`}>
              <CircleCheck size={11} />{valid ? 'Available offline' : 'Access expired'}
            </span>
            <span className="text-muted">Saved {formatSavedAgo(m.savedAt)}</span>
          </div>
          <h3 className="mt-1 font-serif text-[17px] font-semibold leading-tight text-deep">{m.title}</h3>
          {m.author && <p className="mt-0.5 text-xs text-muted">{m.author}</p>}
          <div className="mt-3 flex items-end justify-between gap-2 text-[11px]">
            <span className="text-muted">{fileInfo(m)}</span>
            {m.progressLabel && <span className="text-right font-semibold text-brand">{m.progressLabel}</span>}
          </div>
        </div>
      </div>
      <hr className="my-3 border-line" />
      <div className="flex gap-2">
        <button onClick={() => onOpen(m.id)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-deep text-[13px] font-semibold text-white">
          <Icon size={15} /> {mobile}
        </button>
        <button aria-label={`Remove ${m.title}`} onClick={() => onRemove(m)} className="grid size-11 place-items-center rounded-xl bg-mint text-ink/60"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

export function OfflineMobile({ lib, f, onOpen, onRemove }: Props) {
  const nextSort = () => f.setSort(sortOrder[(sortOrder.indexOf(f.sort) + 1) % sortOrder.length]);
  return (
    <div className="min-h-screen bg-page pb-24">
      <MobileTopBar />
      <section className="rounded-b-[32px] bg-ink px-5 pb-5 pt-5 text-white shadow-[0_8px_20px_rgba(9,47,44,0.18)]">
        <h1 className="font-serif text-2xl">Offline Library</h1>
        <p className="mt-1.5 text-xs text-white/55">Read, listen, and research without connection</p>
        <hr className="my-3 border-white/10" />
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-white/60">
          <span className="inline-flex items-center gap-1.5"><Clock size={12} />Last synced {lib.lastSyncedAt ? formatSyncedAt(lib.lastSyncedAt) : 'never'}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-white/60"><SyncStatus lib={lib} /></div>
      </section>

      <div className="space-y-4 px-4 pt-5">
        <StorageCard lib={lib} />
        <label className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-[0_2px_10px_rgba(9,47,44,0.05)]">
          <Search size={16} className="text-muted" />
          <input value={f.query} onChange={(e) => f.setQuery(e.target.value)} placeholder="Search saved titles or authors..." className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted" />
        </label>
        <div className="-mx-4 flex items-center gap-2 pl-4 pr-4">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {pills.map(({ key, label }) => (
              <button key={key} onClick={() => f.setFormat(key)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${f.format === key ? 'bg-deep text-white' : 'bg-white text-ink/70'}`}>
                {label} ({f.formatCounts[key]})
              </button>
            ))}
          </div>
          <button onClick={nextSort} aria-label={`Sort: ${sortLabels[f.sort]}. Tap to change`} className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-deep">
            <Sparkles size={12} />{shortSort[f.sort]}
          </button>
        </div>

        {lib.status === 'loading' && <LoadingGrid list />}
        {lib.status === 'error' && <ErrorState message={lib.error ?? 'Unknown error'} onRetry={lib.refresh} />}
        {lib.status === 'ready' && f.filtered.length === 0 && <EmptyState filtered={lib.items.length > 0} onReset={f.reset} />}
        {lib.status === 'ready' && f.filtered.map((m) => <Card key={m.id} m={m} onOpen={onOpen} onRemove={onRemove} />)}

        <section className="rounded-2xl bg-mint px-5 py-6 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-ink"><CloudDownload size={18} /></span>
          <h2 className="mt-3 font-serif text-lg text-deep">Expand your offline shelf</h2>
          <p className="mx-auto mt-1 max-w-[260px] text-[11px] leading-4 text-ink/65">Explore over 1,200 curated books, sound recordings, and institutional monographs available for member download.</p>
          <Link to={ROUTES.browse} className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white">Explore Catalogue</Link>
        </section>
      </div>
      <MobileBottomNav />
    </div>
  );
}
