import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** Render a cell. Defaults to `row[key]`. */
  cell?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Tailwind width class, e.g. "w-40". */
  width?: string;
  sortable?: boolean;
}

export interface SortState { key: string; direction: 'asc' | 'desc' }

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Accessible table name. */
  caption: string;
  loading?: boolean;
  /** Rendered in place of the rows when `rows` is empty. Usually an <EmptyState />. */
  emptyState?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRowClick?: (row: T) => void;
  loadingRows?: number;
  className?: string;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export function DataTable<T>({ columns, rows, getRowKey, caption, loading, emptyState, sort, onSortChange, onRowClick, loadingRows = 4, className }: DataTableProps<T>) {
  const toggleSort = (key: string) =>
    onSortChange?.({ key, direction: sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc' });

  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-[16px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink/40">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined} className={cx('whitespace-nowrap py-2.5 pr-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted', alignClass[c.align ?? 'left'], c.width)}>
                  {c.sortable && onSortChange ? (
                    <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase tracking-[0.12em] hover:text-deep">
                      {c.header}{active && (sort!.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody aria-busy={loading || undefined}>
          {loading && Array.from({ length: loadingRows }, (_, i) => (
            <tr key={i} className="border-b border-line">
              {columns.map((c) => <td key={c.key} className="py-3.5 pr-4"><div className="h-4 w-3/4 animate-pulse rounded bg-mint" /></td>)}
            </tr>
          ))}
          {!loading && rows.map((row) => (
            <tr key={getRowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx('border-b border-line', onRowClick && 'cursor-pointer hover:bg-mint-soft')}>
              {columns.map((c) => (
                <td key={c.key} className={cx('py-3.5 pr-4 text-deep', alignClass[c.align ?? 'left'])}>
                  {c.cell ? c.cell(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && emptyState}
    </div>
  );
}
