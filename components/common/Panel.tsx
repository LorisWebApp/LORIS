import type { ReactNode } from 'react';
import { cx } from '../shared/utils/cx';

interface PanelProps {
  as?: 'section' | 'div' | 'article';
  className?: string;
  children: ReactNode;
}

/** White bordered surface used for page sections. */
export function Panel({ as: Tag = 'section', className, children }: PanelProps) {
  return <Tag className={cx('rounded-xl border border-line bg-white', className)}>{children}</Tag>;
}

/** Soft tinted note for guidance text. */
export function Callout({ className, children }: { className?: string; children: ReactNode }) {
  return <aside className={cx('rounded-xl bg-mint px-5 py-4 text-ink/80', className)}>{children}</aside>;
}
