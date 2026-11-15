import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export type StatusVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusBadgeProps {
  label: ReactNode;
  variant?: StatusVariant;
  /** Leading coloured dot. */
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const styles: Record<StatusVariant, { box: string; dot: string }> = {
  neutral: { box: 'bg-mint text-ink', dot: 'bg-ink/50' },
  accent: { box: 'bg-badge text-brand-text', dot: 'bg-brand' },
  success: { box: 'bg-brand/10 text-brand', dot: 'bg-brand' },
  warning: { box: 'bg-amber-100 text-amber-900', dot: 'bg-amber-600' },
  danger: { box: 'bg-rose-bg text-rose-text', dot: 'bg-rose-text' },
  info: { box: 'bg-ink/10 text-ink', dot: 'bg-ink' },
};

/** Compact status or type tag. The label is configurable; the variant only controls colour. */
export function StatusBadge({ label, variant = 'neutral', dot, size = 'md', className }: StatusBadgeProps) {
  const s = styles[variant];
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold uppercase tracking-[0.06em]', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-[12px]', s.box, className)}>
      {dot && <span className={cx('size-1.5 rounded-full', s.dot)} aria-hidden />}
      {label}
    </span>
  );
}
