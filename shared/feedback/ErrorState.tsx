import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../buttons/Button';
import { cx } from '../utils/cx';

export interface ErrorStateProps {
  title?: string;
  message: ReactNode;
  /** When provided, a retry button is shown. */
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again', retrying, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cx('flex flex-col items-center px-6 py-14 text-center', className)}>
      <CircleAlert size={28} className="text-rose-text" aria-hidden />
      <h3 className="mt-4 text-[24px] font-medium leading-tight text-deep">{title}</h3>
      <p className="mt-1.5 max-w-md text-[16px] leading-6 text-muted">{message}</p>
      {onRetry && <div className="mt-6"><Button variant="outline" onClick={onRetry} loading={retrying}>{retryLabel}</Button></div>}
    </div>
  );
}
