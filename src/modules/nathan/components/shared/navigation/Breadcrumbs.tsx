import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../utils/cx';

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (the last item). */
  to?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Use `inverse` on dark surfaces. */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function Breadcrumbs({ items, tone = 'default', className }: BreadcrumbsProps) {
  const inverse = tone === 'inverse';
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cx('m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-[15px]', inverse ? 'text-white/65' : 'text-muted')}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {item.to && !last
                  ? <Link to={item.to} className={cx('underline-offset-4 hover:underline', inverse ? 'hover:text-white' : 'hover:text-deep')}>{item.label}</Link>
                  : <span aria-current={last ? 'page' : undefined} className={cx(last && 'font-semibold', last && (inverse ? 'text-white' : 'text-deep'))}>{item.label}</span>}
              </li>
              {!last && <li aria-hidden className="flex"><ChevronRight size={12} /></li>}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
