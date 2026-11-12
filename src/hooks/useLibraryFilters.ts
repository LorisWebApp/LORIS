import { useMemo, useState } from 'react';
import type { OfflineMaterialMetadata } from '../group-d/types/models';
import { getMaterialKind, type FormatFilter } from '../types/offline';

export type SortKey = 'recent' | 'title' | 'author' | 'size';
export const sortLabels: Record<SortKey, string> = {
  recent: 'Recently Saved', title: 'Title A–Z', author: 'Author A–Z', size: 'Largest First',
};
export const PAGE_SIZE = 6;

export function useLibraryFilters(items: OfflineMaterialMetadata[]) {
  const [format, setFormat] = useState<FormatFilter>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const formatCounts = useMemo(() => {
    const c: Record<FormatFilter, number> = { all: items.length, epub: 0, pdf: 0, audio: 0, video: 0 };
    for (const m of items) {
      const k = getMaterialKind(m);
      if (k !== 'other') c[k] += 1;
    }
    return c;
  }, [items]);

  const subjectCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of items) if (m.category) map.set(m.category, (map.get(m.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = items.filter((m) => {
      if (format !== 'all' && getMaterialKind(m) !== format) return false;
      if (subjects.length && !(m.category && subjects.includes(m.category))) return false;
      if (q && !`${m.title} ${m.author ?? ''} ${m.category ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    out.sort((a, b) => {
      switch (sort) {
        case 'title': return a.title.localeCompare(b.title);
        case 'author': return (a.author ?? '').localeCompare(b.author ?? '');
        case 'size': return b.fileSize - a.fileSize;
        default: return b.savedAt.localeCompare(a.savedAt);
      }
    });
    return out;
  }, [items, format, subjects, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };

  return {
    format, setFormat: resetPage(setFormat), subjects,
    toggleSubject: (s: string) => { setSubjects((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])); setPage(1); },
    query, setQuery: resetPage(setQuery), sort, setSort: resetPage(setSort), view, setView,
    page: safePage, setPage, pageCount, paged, filtered, formatCounts, subjectCounts,
    reset: () => { setFormat('all'); setSubjects([]); setQuery(''); setPage(1); },
  };
}
export type LibraryFilters = ReturnType<typeof useLibraryFilters>;
