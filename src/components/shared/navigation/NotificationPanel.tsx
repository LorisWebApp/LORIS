import { Bell, X } from 'lucide-react';
import { severityStyles, type Severity } from '../feedback/Alert';
import { cx } from '../utils/cx';
import { usePopover } from '../utils/usePopover';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  /** Preformatted time, e.g. "2h ago". */
  time?: string;
  status: Severity;
  read?: boolean;
}

export interface NotificationPanelProps {
  notifications: NotificationItem[];
  title?: string;
  emptyMessage?: string;
  onNotificationClick?: (n: NotificationItem) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (n: NotificationItem) => void;
  /** Use on dark surfaces. */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function NotificationPanel({ notifications, title = 'Notifications', emptyMessage = 'You’re all caught up.', onNotificationClick, onMarkAllRead, onDismiss, tone = 'default', className }: NotificationPanelProps) {
  const { open, toggle, rootRef } = usePopover();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <button type="button" data-popover-trigger aria-haspopup="dialog" aria-expanded={open} aria-label={unread ? `${title}, ${unread} unread` : title} onClick={toggle} className={cx('relative grid size-9 place-items-center rounded-full', tone === 'inverse' ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-mint')}>
        <Bell size={18} aria-hidden />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-white" aria-hidden />}
      </button>
      {open && (
        <div role="dialog" aria-label={title} className="fixed inset-x-3 top-16 z-40 border border-line bg-white shadow-[0_8px_24px_rgba(5,32,30,0.12)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="m-0 text-[14px] font-bold uppercase tracking-[0.14em] text-deep">{title}</h2>
            {onMarkAllRead && unread > 0 && <button onClick={onMarkAllRead} className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">Mark all as read</button>}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[16px] text-muted">{emptyMessage}</p>
          ) : (
            <ul className="m-0 max-h-[360px] list-none divide-y divide-line overflow-y-auto p-0">
              {notifications.map((n) => {
                const { rule } = severityStyles[n.status];
                return (
                  <li key={n.id} className={cx('flex items-start border-l-2', rule)}>
                    <button onClick={() => onNotificationClick?.(n)} className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-mint-soft">
                      <p className={cx('text-[16px] text-deep', !n.read && 'font-semibold')}>{n.title}</p>
                      {n.description && <p className="mt-0.5 text-[15px] text-ink/75">{n.description}</p>}
                      <p className="mt-1 flex items-center gap-2 text-[13px] uppercase tracking-[0.1em] text-muted">
                        <span>{n.status}</span>{n.time && <><span aria-hidden>·</span><span>{n.time}</span></>}{!n.read && <span className="sr-only">Unread</span>}
                      </p>
                    </button>
                    {onDismiss && <button onClick={() => onDismiss(n)} aria-label={`Dismiss ${n.title}`} className="p-3 text-muted hover:text-deep"><X size={14} /></button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
