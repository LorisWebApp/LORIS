import { Fragment } from 'react';
import { DetailRow } from '../data-display/DetailRow';
import { cx } from '../utils/cx';

export interface MaterialMetadataProps {
  author?: string;
  /** ISO string, Date, or a preformatted string such as "2024". */
  publishedAt?: string | Date;
  fileType?: string;
  category?: string;
  fileSize?: string;
  /** Extra label/value pairs (pages, duration, language…). */
  items?: { label: string; value: string }[];
  /** `inline` = one line separated by dots; `stacked` = a labelled list. */
  layout?: 'inline' | 'stacked';
  className?: string;
}

function formatDate(v: string | Date): string {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MaterialMetadata({ author, publishedAt, fileType, category, fileSize, items = [], layout = 'inline', className }: MaterialMetadataProps) {
  const rows: { label: string; value: string }[] = [
    ...(author ? [{ label: 'Author', value: author }] : []),
    ...(publishedAt ? [{ label: 'Published', value: typeof publishedAt === 'string' && /^\d{4}$/.test(publishedAt) ? publishedAt : formatDate(publishedAt) }] : []),
    ...(fileType ? [{ label: 'Format', value: fileType }] : []),
    ...(category ? [{ label: 'Category', value: category }] : []),
    ...(fileSize ? [{ label: 'Size', value: fileSize }] : []),
    ...items,
  ];
  if (rows.length === 0) return null;

  if (layout === 'stacked') {
    return <dl className={cx('m-0', className)}>{rows.map((r) => <DetailRow key={r.label} label={r.label} value={r.value} divider />)}</dl>;
  }
  return (
    <p className={cx('text-[16px] text-muted', className)}>
      {rows.map((r, i) => (
        <Fragment key={r.label}>{i > 0 && <span className="mx-1.5" aria-hidden>·</span>}<span className="sr-only">{r.label}: </span>{r.value}</Fragment>
      ))}
    </p>
  );
}
