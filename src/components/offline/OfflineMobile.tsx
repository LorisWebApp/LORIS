import { Clock, CloudDownload, HardDrive, Sparkles } from 'lucide-react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { sortLabels, type LibraryFilters, type SortKey } from '../../hooks/useLibraryFilters';
import { formatBytes, formatBytesShort, formatSyncedAt } from '../../lib/format';
import type { FormatFilter } from '../../types/offline';
import { ROUTES } from '../../integration/loris';
import { MobileBottomNav, MobileTopBar } from '../layout/MobileChrome';
import { Button, MaterialList, PageHeader, ProgressIndicator, SearchBar, TabNavigation } from '../shared';
import { toMaterialEntry } from './materialEntry';
import { LibraryEmpty, LibraryError, LoadingGrid } from './StateViews';
import { SyncStatus } from './StatusBits';

type Lib = ReturnType<typeof useOfflineLibrary>;
interface Props {
  lib: Lib;
  f: LibraryFilters;
  onOpen: (id: string) => void;
  onRemove: (m: OfflineMaterialMetadata) => void;
}

const pills: { key: FormatFilter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'epub', label: 'EPUB' }, { key: 'pdf', label: 'PDF' }, { key: 'audio', label: 'Audio' }, { key: 'video', label: 'Video' },
];
const sortOrder: SortKey[] = ['recent', 'title', 'author', 'size'];
const shortSort: Record<SortKey, string> = { recent: 'Recent', title: 'A–Z', author: 'Author', size: 'Size' };

function StorageCard({ lib }: { lib: Lib }) {
  const { storage, items } = lib;
  const { usedBytes, quotaBytes, byKind } = storage;
  const used = formatBytes(usedBytes).split(' ');
  return (
    <div className="bg-white p-4">
      <div className="flex items-center gap-3">
        <HardDrive size={22} className="text-ink" aria-hidden />
        <div className="flex-1">
          <p className="text-[17px] font-semibold leading-tight text-deep">Storage Allocation</p>
          <p className="text-[14px] text-muted">{items.length} item{items.length === 1 ? '' : 's'} saved on device</p>
        </div>
        <p className="text-[17px] font-bold text-deep">{used[0]} {used[1]}<span className="font-normal text-muted">{quotaBytes ? ` / ${formatBytesShort(quotaBytes)}` : ''}</span></p>
      </div>
      <ProgressIndicator
        className="mt-4" size="md" max={quotaBytes ?? Math.max(usedBytes, 1)}
        segments={[
          { value: byKind.epub, className: 'bg-[#3f7f78]', label: 'EPUB' },
          { value: byKind.pdf, className: 'bg-[#9ce0d3]', label: 'PDF' },
          { value: byKind.media, className: 'bg-deep', label: 'Media' },
        ]}
      />
      <div className="mt-3 flex justify-between text-[13px] font-semibold text-ink/75">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#3f7f78]" />EPUB ({formatBytesShort(byKind.epub)})</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#9ce0d3]" />PDF ({formatBytesShort(byKind.pdf)})</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-deep" />Media ({formatBytesShort(byKind.media)})</span>
      </div>
    </div>
  );
}

export function OfflineMobile({ lib, f, onOpen, onRemove }: Props) {
  const nextSort = () => f.setSort(sortOrder[(sortOrder.indexOf(f.sort) + 1) % sortOrder.length]);
  const entries = f.filtered.map((m) => toMaterialEntry(m, { onOpen, onRemove }, true));
  return (
    <div className="min-h-screen bg-page pb-24">
      <MobileTopBar />
      <PageHeader
        tone="dark" size="sm"
        className="rounded-b-[32px] px-5 pb-5 pt-5" contentClassName=""
        title="Offline Library" description="Read, listen, and research without connection"
        meta={
          <div className="border-t border-white/10 pt-3 text-[14px]">
            <span className="inline-flex items-center gap-1.5"><Clock size={12} />Last synced {lib.lastSyncedAt ? formatSyncedAt(lib.lastSyncedAt) : 'never'}</span>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5"><SyncStatus lib={lib} /></div>
          </div>
        }
      />

      <div className="space-y-4 px-4 pt-5">
        <StorageCard lib={lib} />
        <SearchBar appearance="raised" placeholder="Search saved titles or authors..." value={f.query} onChange={f.setQuery} className="py-3.5" />
        <div className="-mx-4 flex items-center gap-2 px-4">
          <TabNavigation aria-label="Filter by format" variant="pill" activeId={f.format} onChange={(id) => f.setFormat(id as FormatFilter)} className="no-scrollbar flex-1 overflow-x-auto"
            tabs={pills.map(({ key, label }) => ({ id: key, label, count: f.formatCounts[key] }))} />
          <Button variant="text" shape="pill" size="sm" className="bg-white" leftIcon={<Sparkles size={12} />} onClick={nextSort} aria-label={`Sort: ${sortLabels[f.sort]}. Tap to change`}>{shortSort[f.sort]}</Button>
        </div>

        {lib.status === 'loading' && <LoadingGrid list />}
        {lib.status === 'error' && <LibraryError message={lib.error ?? 'Unknown error'} onRetry={lib.refresh} />}
        {lib.status === 'ready' && f.filtered.length === 0 && <LibraryEmpty filtered={lib.items.length > 0} onReset={f.reset} />}
        {lib.status === 'ready' && f.filtered.length > 0 && <MaterialList materials={entries} layout="compact" framed aria-label="Saved materials" />}

        <section className="bg-mint px-5 py-6 text-center">
          <CloudDownload size={26} className="mx-auto text-ink" aria-hidden />
          <h2 className="mt-3 text-[24px] font-medium leading-tight text-deep">Expand your offline shelf</h2>
          <p className="mx-auto mt-1 max-w-[280px] text-[15px] leading-5 text-ink/70">Explore over 1,200 curated books, sound recordings, and institutional monographs available for member download.</p>
          <Button to={ROUTES.browse} shape="pill" className="mt-4">Explore Catalogue</Button>
        </section>
      </div>
      <MobileBottomNav />
    </div>
  );
}
