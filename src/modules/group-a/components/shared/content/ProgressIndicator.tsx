import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface ProgressSegment {
  value: number;
  /** Tailwind background class for this segment, e.g. "bg-brand". */
  className?: string;
  label?: string;
}

export interface ProgressIndicatorProps {
  /** Single-bar value. Ignored when `segments` is provided. */
  value?: number;
  /** The value that represents 100%. Default 100. */
  max?: number;
  /** Multiple stacked segments (e.g. storage by file type), each measured against `max`. */
  segments?: ProgressSegment[];
  label?: ReactNode;
  /** Text shown at the right of the label row. `true` shows a percentage. */
  showValue?: boolean | ReactNode;
  size?: 'sm' | 'md';
  tone?: 'default' | 'inverse';
  /** Overrides for the track colour. */
  trackClassName?: string;
  className?: string;
}

export function ProgressIndicator({ value = 0, max = 100, segments, label, showValue, size = 'md', tone = 'default', trackClassName, className }: ProgressIndicatorProps) {
  const inverse = tone === 'inverse';
  const parts: ProgressSegment[] = segments ?? [{ value, className: inverse ? 'bg-badge' : 'bg-ink' }];
  const total = parts.reduce((t, s) => t + s.value, 0);
  const pct = max > 0 ? Math.min(100, (total / max) * 100) : 0;
  const shown = showValue === true ? `${Math.round(pct)}%` : showValue;

  return (
    <div className={className}>
      {(label || shown) && (
        <div className={cx('mb-1.5 flex items-baseline justify-between text-[15px]', inverse ? 'text-white/75' : 'text-ink/80')}>
          <span>{label}</span><span className="font-semibold tabular-nums">{shown}</span>
        </div>
      )}
      <div
        role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(total)} aria-label={typeof label === 'string' ? label : undefined}
        className={cx('flex w-full gap-px overflow-hidden rounded-full', size === 'sm' ? 'h-1' : 'h-1.5', trackClassName ?? (inverse ? 'bg-white/20' : 'bg-line'))}
      >
        {parts.map((s, i) => (
          <span key={i} title={s.label} className={cx('h-full', s.className ?? 'bg-ink')} style={{ width: `${max > 0 ? Math.min(100, (s.value / max) * 100) : 0}%` }} />
        ))}
      </div>
    </div>
  );
}
