import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { MaterialItem, type MaterialItemProps, type MaterialLayout } from './MaterialItem';

export type MaterialListEntry = Omit<MaterialItemProps, 'layout' | 'framed'> & { id: string };

export interface MaterialListProps {
  materials: MaterialListEntry[];
  /** `grid` = cover cards in columns, `list` = rows, `compact` = stacked mobile entries. */
  layout?: 'grid' | 'list' | 'compact';
  /** Columns for the grid layout at wide widths. */
  columns?: 2 | 3 | 4;
  framed?: boolean;
  loading?: boolean;
  /** Rendered when there are no materials (and not loading). */
  emptyState?: ReactNode;
  /** Custom skeleton while loading. */
  loadingState?: ReactNode;
  /** Replace the default MaterialItem rendering. */
  renderItem?: (material: MaterialListEntry, layout: MaterialLayout) => ReactNode;
  'aria-label'?: string;
  className?: string;
}

const gridCols = { 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' } as const;
const itemLayout = { grid: 'card', list: 'row', compact: 'compact' } as const;

export function MaterialList({ materials, layout = 'grid', columns = 3, framed, loading, emptyState, loadingState, renderItem, className, ...rest }: MaterialListProps) {
  if (loading) return <>{loadingState ?? <p role="status" className="py-10 text-center text-[16px] text-muted">Loading materials…</p>}</>;
  if (materials.length === 0) return <>{emptyState ?? null}</>;
  const l = itemLayout[layout];
  return (
    <ul aria-label={rest['aria-label']} className={cx('m-0 list-none p-0', layout === 'grid' ? cx('grid grid-cols-1 gap-6 sm:grid-cols-2', gridCols[columns]) : layout === 'list' ? 'space-y-3' : 'space-y-4', className)}>
      {materials.map((m) => (
        <li key={m.id} className="flex [&>*]:w-full">
          {renderItem ? renderItem(m, l) : <MaterialItem {...m} layout={l} framed={framed} />}
        </li>
      ))}
    </ul>
  );
}
