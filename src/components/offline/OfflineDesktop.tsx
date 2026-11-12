import { Grid2x2, LayoutList, ShieldCheck } from 'lucide-react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { sortLabels, type LibraryFilters, type SortKey } from '../../hooks/useLibraryFilters';
import { formatBytes, formatDayTime } from '../../lib/format';
import type { FormatFilter } from '../../types/offline';
import { ROUTES } from '../../integration/loris';
import { TopNav } from '../layout/TopNav';
import { SiteFooter } from '../layout/SiteFooter';
import { Button, FilterDropdown, MaterialList, Pagination, ProgressIndicator, SearchBar, SectionHeader, StatDisplay, StatusBadge, TabNavigation } from '../shared';
import { toMaterialEntry } from './materialEntry';
import { LibraryEmpty, LibraryError, LoadingGrid } from './StateViews';
import { SyncStatus, VerifiedIcon } from './StatusBits';
import { PageHeader } from '../shared';

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
  const [num, unit] = formatBytes(usedBytes).split(' ');
  return (
    <div className="w-[400px] shrink-0 border border-white/15 p-5 text-white">
      <div className="flex justify-end"><StatusBadge label={`${readyCount} ${readyCount === 1 ? 'Item' : 'Items'} Ready`} variant="accent" size="sm" /></div>
      <StatDisplay
        tone="inverse" label="Vault Volume" value={num}
        unit={`${unit}${quotaBytes ? ` / ${formatBytes(quotaBytes)}` : ' on device'}`}
        supporting={quotaBytes ? `${pct < 0.1 && usedBytes ? '<0.1' : pct.toFixed(1)}% capacity` : undefined}
      />
      <ProgressIndicator
        className="mt-4" tone="inverse" size="sm" max={quotaBytes ?? Math.max(usedBytes, 1)}
        segments={[
          { value: byKind.epub, className: 'bg-badge', label: 'EPUB' },
          { value: byKind.pdf, className: 'bg-[#7fd9c8]', label: 'PDF' },
          { value: byKind.media, className: 'bg-[#c4d8d4]', label: 'Audio/Video' },
        ]}
      />
      <div className="mt-2.5 flex items-center justify-between text-[13px] text-white/65">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-badge" />EPUB</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#7fd9c8]" />PDF</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#c4d8d4]" />Audio/Video</span>
        <Button variant="text" tone="inverse" size="sm" className="!h-auto !px-1" onClick={onPurge} disabled={items.length === 0}>Purge</Button>
      </div>
    </div>
  );
}

function Sidebar({ lib, f }: { lib: Lib; f: LibraryFilters }) {
  const soonest = lib.items.map((m) => new Date(m.offlineAllowedUntil).getTime()).sort((a, b) => a - b)[0];
  const days = soonest ? Math.max(0, Math.ceil((soonest - Date.now()) / 86_400_000)) : null;
  return (
    <aside className="w-[300px] shrink-0 space-y-5">
      <div className="bg-ink p-5 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-badge" aria-hidden />
          <div>
            <p className="text-[17px] font-semibold leading-tight">{lib.status === 'error' ? 'Offline Node Unavailable' : 'Offline Node Active'}</p>
            <p className="text-[14px] text-white/60">Stored on this device</p>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-5 text-white/70">
          {days === null
            ? 'Saved works stay available offline until their access expiry.'
            : `Saved works stay available offline until their access expiry — the next is in ${days} day${days === 1 ? '' : 's'}.`}
        </p>
        <p className="mt-4 text-[15px] font-semibold">Storage Health: {lib.healthPercent}%</p>
      </div>

      <div className="bg-white p-5">
        <SectionHeader as="h2" size="sm" title="Vault Filters" actions={<Button variant="text" size="sm" className="!h-auto !px-1" onClick={f.reset}>Reset All</Button>} />
        <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Document Format</p>
        <ul className="m-0 mt-3 list-none space-y-3 p-0">
          {checkFormats.map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 text-[16px] text-deep">
                <input type="checkbox" checked={f.format === key} onChange={() => f.setFormat(f.format === key ? 'all' : key)} className="size-4 accent-ink" />
                <span className="flex-1">{label}</span>
                <span className="text-[14px] text-muted">{f.formatCounts[key]}</span>
              </label>
            </li>
          ))}
        </ul>
        <hr className="my-5 border-line" />
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Subject Area</p>
        <ul className="m-0 mt-3 list-none space-y-3 p-0">
          {f.subjectCounts.length === 0 && <li className="text-[15px] text-muted">No subjects yet</li>}
          {f.subjectCounts.map(([name, count]) => (
            <li key={name}>
              <label className="flex cursor-pointer items-center gap-3 text-[16px] text-deep">
                <input type="checkbox" checked={f.subjects.includes(name)} onChange={() => f.toggleSubject(name)} className="size-4 accent-ink" />
                <span className="flex-1">{name}</span>
                <span className="text-[14px] text-muted">{count}</span>
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
    <div className="bg-white p-5">
      <div className="flex items-center gap-5">
        <SearchBar className="flex-1" appearance="pill" placeholder="Search saved materials, authors, topics..." value={f.query} onChange={f.setQuery} />
        <FilterDropdown
          label="Sort" align="right" value={f.sort} onChange={(v) => f.setSort(v as SortKey)}
          options={(Object.keys(sortLabels) as SortKey[]).map((k) => ({ value: k, label: sortLabels[k] }))}
        />
        <div className="flex gap-1">
          {([['grid', Grid2x2, 'Grid view'], ['list', LayoutList, 'List view']] as const).map(([v, Icon, label]) => (
            <Button key={v} variant="icon" filled={f.view === v} shape="pill" size="sm" aria-label={label} aria-pressed={f.view === v} onClick={() => f.setView(v)}>
              <Icon size={14} />
            </Button>
          ))}
        </div>
      </div>
      <hr className="my-4 border-line" />
      <TabNavigation
        aria-label="Filter by format" variant="pill" activeId={f.format} onChange={(id) => f.setFormat(id as FormatFilter)}
        tabs={pillFormats.map(({ key, label }) => ({ id: key, label, count: f.formatCounts[key] }))} className="flex-wrap"
      />
    </div>
  );
}

export function OfflineDesktop({ lib, f, onOpen, onRemove, onPurge }: Props) {
  const entries = f.paged.map((m) => toMaterialEntry(m, { onOpen, onRemove }, false));
  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <PageHeader
        tone="dark" size="lg" accent
        className="pb-12 pt-10" contentClassName="px-8"
        breadcrumbs={[{ label: 'Library Vault' }, { label: 'Offline Library' }]}
        title="Offline Library"
        description="Access your saved manuscripts, academic journals, and spoken recordings without network connectivity. In-line annotations, highlights, and bookmarks sync automatically upon reconnecting."
        meta={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><VerifiedIcon />Last verified: {lib.lastVerifiedAt ? formatDayTime(lib.lastVerifiedAt) : '—'}</span>
            <span className="opacity-40">•</span>
            <SyncStatus lib={lib} />
          </div>
        }
        aside={<VaultVolume lib={lib} onPurge={onPurge} />}
      />
      <div className="mx-auto flex max-w-[1312px] items-start gap-8 px-8 pt-10">
        <Sidebar lib={lib} f={f} />
        <div className="min-w-0 flex-1 space-y-6">
          <Toolbar f={f} />
          {lib.status === 'loading' && <LoadingGrid list={f.view === 'list'} />}
          {lib.status === 'error' && <LibraryError message={lib.error ?? 'Unknown error'} onRetry={lib.refresh} />}
          {lib.status === 'ready' && f.filtered.length === 0 && <LibraryEmpty filtered={lib.items.length > 0} onReset={f.reset} />}
          {lib.status === 'ready' && f.filtered.length > 0 && (
            <>
              <MaterialList materials={entries} layout={f.view === 'grid' ? 'grid' : 'list'} columns={3} framed aria-label="Saved materials" />
              <Pagination className="bg-white px-5 py-3.5" page={f.page} pageCount={f.pageCount} onPageChange={f.setPage} />
            </>
          )}
          <section className="bg-deep p-8 text-white">
            <div className="flex items-center justify-between gap-6">
              <div className="max-w-md">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-badge">Continue Discovery</p>
                <h2 className="mt-2 text-[30px] font-medium leading-tight">Expand your travelling repository</h2>
                <p className="mt-2 text-[16px] leading-6 text-white/65">Traveling to field research or remote sites? Queue multiple books, papers, or audio archives for bulk offline syncing with one click.</p>
              </div>
              <Button to={ROUTES.browse} tone="inverse" shape="pill">Explore Full Catalogue</Button>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
