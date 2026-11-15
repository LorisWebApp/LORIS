import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small uppercase line above the title. */
  eyebrow?: ReactNode;
  /** Actions aligned to the right, e.g. a text Button. */
  actions?: ReactNode;
  /** `lg` = section heading, `sm` = small uppercase label for panels and sidebars. */
  size?: 'lg' | 'sm';
  as?: 'h2' | 'h3' | 'h4';
  /** Subtle rule underneath. */
  divider?: boolean;
  className?: string;
}

export function SectionHeader({ title, description, eyebrow, actions, size = 'lg', as: Tag = 'h2', divider, className }: SectionHeaderProps) {
  return (
    <div className={cx('flex items-end justify-between gap-4', divider && 'border-b border-line pb-3', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</p>}
        <Tag className={size === 'lg' ? 'text-[30px] font-medium leading-tight text-deep' : 'text-[14px] font-bold uppercase tracking-[0.14em] text-deep'}>{title}</Tag>
        {description && <p className="mt-1 text-[17px] leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
