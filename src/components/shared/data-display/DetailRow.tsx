import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface DetailRowProps {
  label: ReactNode;
  /** The value; falls back to `children`. */
  value?: ReactNode;
  children?: ReactNode;
  /** `inline` puts label and value on one line (label left, value right); `stacked` puts the value under the label. */
  layout?: 'inline' | 'stacked';
  /** Subtle divider underneath. */
  divider?: boolean;
  className?: string;
}

export function DetailRow({ label, value, children, layout = 'inline', divider, className }: DetailRowProps) {
  const content = value ?? children;
  return (
    <div className={cx('py-2.5', layout === 'inline' ? 'flex items-baseline justify-between gap-6' : 'flex flex-col gap-0.5', divider && 'border-b border-line', className)}>
      <dt className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className={cx('m-0 text-[17px] text-deep', layout === 'inline' && 'text-right')}>{content ?? '—'}</dd>
    </div>
  );
}
