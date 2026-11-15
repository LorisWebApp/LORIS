import type { ReactNode } from 'react';
import { cx } from '../shared/utils/cx';

/** White surface with a thin border: the container used across the dashboards. */
export function Panel({ children, className, as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'aside'; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  return <Tag className={cx('rounded-lg border border-line bg-white', className)} {...rest}>{children}</Tag>;
}

/** Tinted note strip ("A thoughtful welcome", "Every change is recorded"). */
export function Callout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg bg-mint px-6 py-4 text-[16px] text-ink/80', className)}>{children}</div>;
}
