import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { severityStyles, type Severity } from './Alert';

export interface ToastNotificationProps {
  /** Renders nothing when false. */
  open?: boolean;
  variant?: Severity;
  title?: string;
  message: ReactNode;
  action?: ReactNode;
  onClose: () => void;
  /** Auto-dismiss after this many ms. 0 disables. Default 5000. */
  duration?: number;
  /** `inline` renders in normal flow (documentation, tests); others are fixed to the viewport. */
  placement?: 'bottom-center' | 'top-right' | 'inline';
  className?: string;
}

const placements = {
  'bottom-center': 'fixed bottom-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:bottom-8',
  'top-right': 'fixed right-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm',
  inline: 'w-full max-w-md',
} as const;

const iconOnDark: Record<Severity, string> = { info: 'text-badge', success: 'text-badge', warning: 'text-amber-300', error: 'text-rose-300' };

export function ToastNotification({ open = true, variant = 'info', title, message, action, onClose, duration = 5000, placement = 'bottom-center', className }: ToastNotificationProps) {
  useEffect(() => {
    if (!open || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose, message]);

  if (!open) return null;
  const { Icon } = severityStyles[variant];
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cx('flex items-start gap-3 bg-deep px-4 py-3 text-white shadow-[0_6px_24px_rgba(5,32,30,0.25)]', placements[placement], className)}>
      <Icon size={18} className={cx('mt-1 shrink-0', iconOnDark[variant])} aria-hidden />
      <div className="min-w-0 flex-1 text-[16px] leading-6">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'text-white/80' : ''}>{message}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
      <button onClick={onClose} aria-label="Dismiss notification" className="rounded p-1 text-white/60 hover:text-white"><X size={16} /></button>
    </div>
  );
}
