import { cx } from '../utils/cx';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Provide either `pageCount`, or `totalItems` + `pageSize`. */
  pageCount?: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Pages shown either side of the current page. */
  siblings?: number;
  className?: string;
}

function range(from: number, to: number) { return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i); }

function pagesToShow(page: number, count: number, siblings: number): (number | 'gap')[] {
  if (count <= siblings * 2 + 5) return range(1, count);
  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, count - 1);
  return [1, ...(left > 2 ? ['gap' as const] : []), ...range(left, right), ...(right < count - 1 ? ['gap' as const] : []), count];
}

export function Pagination({ page, pageCount, totalItems, pageSize = 10, pageSizeOptions, onPageChange, onPageSizeChange, siblings = 1, className }: PaginationProps) {
  const count = Math.max(1, pageCount ?? Math.ceil((totalItems ?? 0) / pageSize));
  const current = Math.min(Math.max(page, 1), count);
  const btn = 'min-w-9 rounded-full px-3 py-1.5 text-[15px] font-semibold transition-colors disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className={cx('flex flex-wrap items-center gap-x-6 gap-y-3', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <button className={cx(btn, 'text-ink hover:bg-mint')} disabled={current <= 1} onClick={() => onPageChange(current - 1)}>Previous</button>
        {pagesToShow(current, count, siblings).map((p, i) =>
          p === 'gap'
            ? <span key={`g${i}`} className="px-1 text-muted" aria-hidden>…</span>
            : <button key={p} aria-current={p === current ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => onPageChange(p)} className={cx(btn, p === current ? 'bg-deep text-white' : 'text-ink hover:bg-mint')}>{p}</button>,
        )}
        <button className={cx(btn, 'text-ink hover:bg-mint')} disabled={current >= count} onClick={() => onPageChange(current + 1)}>Next</button>
      </div>
      {pageSizeOptions && onPageSizeChange && (
        <label className="flex items-center gap-2 text-[15px] text-muted">
          Rows per page
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="border-b border-ink/30 bg-transparent pb-0.5 font-semibold text-deep outline-none">
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </nav>
  );
}
