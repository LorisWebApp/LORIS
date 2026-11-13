import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: ReactNode;
  /** Small icon shown before the title. */
  icon?: ReactNode;
  /** Line under the description (status, timestamps). */
  meta?: ReactNode;
  /** Actions aligned to the right of the title block. */
  actions?: ReactNode;
  /** Larger secondary content on the right (e.g. a StatDisplay). */
  aside?: ReactNode;
  /** `dark` renders a full-bleed ink band. */
  tone?: 'light' | 'dark';
  /** Title scale: `lg` page title, `md` secondary pages, `sm` mobile/compact. */
  size?: 'sm' | 'md' | 'lg';
  /** Short rule above the title. */
  accent?: boolean;
  /** Extra classes for the outer band (padding, radius). */
  className?: string;
  /** Extra classes for the inner width container. */
  contentClassName?: string;
}

const titleSize = { lg: 'text-[50px] leading-none', md: 'text-[38px] leading-none', sm: 'text-[28px] leading-tight' } as const;

export function PageHeader({ title, description, breadcrumbs, eyebrow, icon, meta, actions, aside, tone = 'light', size = 'lg', accent, className, contentClassName }: PageHeaderProps) {
  const dark = tone === 'dark';
  return (
    <header className={cx(dark ? 'bg-ink text-white' : 'text-deep', className)}>
      <div className={cx('mx-auto flex w-full max-w-[1312px] flex-wrap items-center justify-between gap-x-10 gap-y-5', contentClassName)}>
        <div className="min-w-0 max-w-[680px]">
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} tone={dark ? 'inverse' : 'default'} />}
          {accent && <span className={cx('mt-8 block h-px w-8', dark ? 'bg-badge' : 'bg-deep')} aria-hidden />}
          {eyebrow && <p className={cx('mb-2 text-[13px] font-semibold uppercase tracking-[0.14em]', dark ? 'text-badge' : 'text-muted')}>{eyebrow}</p>}
          <div className={cx('flex items-center gap-3', (breadcrumbs || accent) && 'mt-3')}>
            {icon && <span className={dark ? 'text-white/80' : 'text-ink'} aria-hidden>{icon}</span>}
            <h1 className={cx('m-0 font-medium tracking-tight', titleSize[size])}>{title}</h1>
          </div>
          {description && <p className={cx('mt-4 text-[17px] leading-7', dark ? 'text-white/75' : 'text-ink/75', size === 'sm' && 'mt-1.5 text-[16px] leading-6')}>{description}</p>}
          {meta && <div className={cx('mt-4 text-[15px]', dark ? 'text-white/65' : 'text-muted')}>{meta}</div>}
        </div>
        {(aside || actions) && <div className="flex shrink-0 items-center gap-3">{aside}{actions}</div>}
      </div>
    </header>
  );
}
