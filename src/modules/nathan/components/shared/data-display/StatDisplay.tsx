import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface StatDisplayProps {
  label: ReactNode;
  value: ReactNode;
  /** Small text next to the value, e.g. "GB" or "/ 5.0 GB". */
  unit?: ReactNode;
  /** Supporting information under the value, e.g. a change or a note. */
  supporting?: ReactNode;
  size?: 'md' | 'lg';
  align?: 'left' | 'right';
  /** Use on dark surfaces. */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function StatDisplay({ label, value, unit, supporting, size = 'md', align = 'left', tone = 'default', className }: StatDisplayProps) {
  const inverse = tone === 'inverse';
  return (
    <div className={cx(align === 'right' && 'text-right', className)}>
      <p className={cx('text-[13px] font-semibold uppercase tracking-[0.12em]', inverse ? 'text-white/65' : 'text-muted')}>{label}</p>
      <p className={cx('mt-1 flex items-baseline gap-1.5 leading-none', align === 'right' && 'justify-end', inverse ? 'text-white' : 'text-deep')}>
        <span className={cx('font-medium tabular-nums', size === 'lg' ? 'text-[48px]' : 'text-[34px]')}>{value}</span>
        {unit && <span className={cx('text-[15px]', inverse ? 'text-white/60' : 'text-muted')}>{unit}</span>}
      </p>
      {supporting && <p className={cx('mt-2 text-[15px]', inverse ? 'text-badge' : 'text-ink/70')}>{supporting}</p>}
    </div>
  );
}
