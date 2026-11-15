import type { ReactNode } from 'react';
import { StatusBadge, type StatusVariant } from '../data-display/StatusBadge';
import { cx } from '../utils/cx';
import { MaterialMetadata, type MaterialMetadataProps } from './MaterialMetadata';

export type MaterialLayout = 'card' | 'row' | 'compact';

export interface MaterialItemProps {
  title: string;
  /** Usually the author or creator. */
  subtitle?: string;
  /** Cover content (image or generated artwork). Sized by the layout. */
  cover: ReactNode;
  /** Elements positioned over the cover (labels, icons). The cover container is `relative`. */
  coverOverlay?: ReactNode;
  /** File-type tag, e.g. { label: 'EPUB' }. */
  tag?: { label: string; variant?: StatusVariant };
  /** Short facts beside the tag, e.g. ["248 pages", "18.4 MB"]. */
  details?: string[];
  /** Fuller bibliographic metadata (publication date, category…). */
  metadata?: MaterialMetadataProps;
  /** Availability or state line. */
  status?: ReactNode;
  /** Secondary status, e.g. "Saved 2d ago". Inline after `status` in `card`; right-aligned in `compact`. */
  statusAside?: ReactNode;
  /** Right-aligned note on the details row (progress). Shown in `compact` and `row` only. */
  aside?: ReactNode;
  /** Action area, usually Buttons. */
  actions?: ReactNode;
  layout?: MaterialLayout;
  /** White surface behind the item. Off by default so items sit directly on the page. */
  framed?: boolean;
  className?: string;
}

export function MaterialItem({ title, subtitle, cover, coverOverlay, tag, details = [], metadata, status, statusAside, aside, actions, layout = 'card', framed, className }: MaterialItemProps) {
  const tagEl = tag && <StatusBadge label={tag.label} variant={tag.variant ?? 'accent'} size="sm" />;
  const detailText = details.join(' • ');

  if (layout === 'compact') {
    return (
      <article className={cx('p-4', framed ? 'bg-white' : 'border-b border-line', className)}>
        <div className="flex gap-3">
          <div className="relative h-[110px] w-20 shrink-0 overflow-hidden rounded-[4px]">{cover}{coverOverlay}</div>
          <div className="min-w-0 flex-1">
            {(status || statusAside) && <div className="flex items-center justify-between gap-2 text-[14px]">{status}<span className="text-muted">{statusAside}</span></div>}
            <h3 className="mt-1 text-[20px] font-semibold leading-tight text-deep">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[16px] text-muted">{subtitle}</p>}
            <div className="mt-2.5 flex items-end justify-between gap-2 text-[15px]">
              <span className="flex items-center gap-2 text-muted">{tagEl}{detailText}</span>
              {aside && <span className="text-right font-semibold text-brand">{aside}</span>}
            </div>
            {metadata && <MaterialMetadata {...metadata} className="mt-1" />}
          </div>
        </div>
        {actions && <div className="mt-3 flex gap-2 border-t border-line pt-3">{actions}</div>}
      </article>
    );
  }

  if (layout === 'row') {
    return (
      <article className={cx('flex items-center gap-5 p-4', framed ? 'bg-white' : 'border-b border-line', className)}>
        <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-[4px]">{cover}{coverOverlay}</div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] text-muted">{tagEl}{detailText}</p>
          <h3 className="mt-1 truncate text-[21px] font-semibold leading-tight text-deep">{title}</h3>
          {subtitle && <p className="text-[16px] text-muted">{subtitle}</p>}
          {metadata && <MaterialMetadata {...metadata} className="mt-0.5" />}
          {(status || statusAside) && <p className="mt-1 text-[15px]">{status}{statusAside && <> <span aria-hidden>•</span> {statusAside}</>}</p>}
        </div>
        {aside && <span className="text-[15px] font-semibold text-brand">{aside}</span>}
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </article>
    );
  }

  return (
    <article className={cx('flex flex-col', framed && 'bg-white', className)}>
      <div className="relative h-[232px] shrink-0 overflow-hidden">{cover}{coverOverlay}</div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-2 text-[15px] text-muted">{tagEl}{detailText}</p>
        <h3 className="mt-2 text-[21px] font-semibold leading-snug text-deep">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[16px] text-muted">{subtitle}</p>}
        {metadata && <MaterialMetadata {...metadata} className="mt-1" />}
        {(status || statusAside) && <p className="mt-3 text-[15px]">{status}{statusAside && <> <span aria-hidden>•</span> {statusAside}</>}</p>}
        {actions && <div className="mt-auto flex items-center gap-2 pt-5">{actions}</div>}
      </div>
    </article>
  );
}
