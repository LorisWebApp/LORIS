import { Loader2 } from 'lucide-react';
import { cx } from '../utils/cx';

export interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  /** Visible text next to the spinner; also the accessible name. */
  label?: string;
  /** Stack the label under the spinner and centre it in its container. */
  centered?: boolean;
  className?: string;
}

const px = { sm: 16, md: 24, lg: 40 } as const;

export function LoadingIndicator({ size = 'md', label, centered, className }: LoadingIndicatorProps) {
  return (
    <div role="status" aria-live="polite" className={cx('flex items-center gap-3 text-ink', centered && 'flex-col justify-center py-10 text-center', className)}>
      <Loader2 size={px[size]} className="animate-spin" aria-hidden />
      {label ? <span className="text-[15px] text-muted">{label}</span> : <span className="sr-only">Loading</span>}
    </div>
  );
}
