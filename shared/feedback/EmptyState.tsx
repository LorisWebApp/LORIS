import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface EmptyStateProps {
  /** A small icon element (e.g. a lucide icon). Ignored when `illustration` is given. */
  icon?: ReactNode;
  /** A larger custom illustration (SVG or image). */
  illustration?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Optional call to action, e.g. a Button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, illustration, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-14 text-center', className)}>
      {illustration ?? (icon && <span className="text-ink/50" aria-hidden>{icon}</span>)}
      <h3 className={cx('text-[24px] font-medium leading-tight text-deep', Boolean(illustration || icon) && 'mt-4')}>{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[16px] leading-6 text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
