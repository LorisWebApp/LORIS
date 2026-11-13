import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export type Severity = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  severity?: Severity;
  title?: string;
  children?: ReactNode;
  /** Optional action, e.g. a text Button. */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const severityStyles: Record<Severity, { rule: string; icon: string; Icon: typeof Info }> = {
  info: { rule: 'border-ink', icon: 'text-ink', Icon: Info },
  success: { rule: 'border-brand', icon: 'text-brand', Icon: CircleCheck },
  warning: { rule: 'border-amber-600', icon: 'text-amber-700', Icon: TriangleAlert },
  error: { rule: 'border-rose-text', icon: 'text-rose-text', Icon: CircleAlert },
};

/** Inline message. A coloured rule carries severity; there is no boxed background. */
export function Alert({ severity = 'info', title, children, action, onDismiss, className }: AlertProps) {
  const { rule, icon, Icon } = severityStyles[severity];
  return (
    <div role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'} className={cx('flex gap-3 border-l-2 py-1 pl-4', rule, className)}>
      <Icon size={18} className={cx('mt-1 shrink-0', icon)} aria-hidden />
      <div className="min-w-0 flex-1 text-[16px] leading-6 text-deep">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'text-ink/80' : ''}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss" className="h-fit rounded p-1 text-muted hover:text-deep"><X size={16} /></button>}
    </div>
  );
}
