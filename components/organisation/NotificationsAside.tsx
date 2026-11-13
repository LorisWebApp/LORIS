import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, TabNavigation } from '../shared';
import { Panel } from '../common/Panel';
import type { PlatformNotification } from '../../types/platform';
import { formatWhen } from '../../utils/format';
import { cx } from '../shared/utils/cx';

interface Props {
  notifications: PlatformNotification[];
  unread: number;
  /** Highlight the notification that links to this path ("Reviewing now"). */
  currentLink?: string;
  onMarkAllRead: () => void;
}

/** Side panel listing registration requests and support tickets. */
export function NotificationsAside({ notifications, unread, currentLink, onMarkAllRead }: Props) {
  const [tab, setTab] = useState<'all' | 'registration' | 'ticket'>('all');
  const shown = notifications.filter((n) => tab === 'all' || n.kind === tab);
  const count = (k: 'registration' | 'ticket') => notifications.filter((n) => n.kind === k).length;

  return (
    <Panel as="aside" aria-label="Notifications" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader title="Notifications" description="Registration requests and support tickets" />
        {unread > 0 && <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 text-[12px] font-semibold text-ink">{unread} unread</span>}
      </div>

      <TabNavigation
        className="mt-4"
        variant="pill"
        aria-label="Filter notifications"
        activeId={tab}
        onChange={(id) => setTab(id as typeof tab)}
        tabs={[{ id: 'all', label: 'All', count: notifications.length }, { id: 'registration', label: 'Requests', count: count('registration') }, { id: 'ticket', label: 'Tickets', count: count('ticket') }]}
      />

      {shown.length === 0 ? (
        <p className="mt-6 text-[15px] text-muted">Nothing new here.</p>
      ) : (
        <ul className="mt-4 list-none space-y-2 p-0">
          {shown.slice(0, 6).map((n) => {
            const current = currentLink === n.link;
            return (
              <li key={n.id} className={cx('rounded-md p-3', current ? 'bg-mint' : 'border border-transparent hover:bg-mint-soft')}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{n.label}</p>
                <p className="text-[16px] font-medium text-deep">{n.headline}</p>
                <p className="text-[14px] text-muted">{n.detail}</p>
                <p className="text-[13px] text-muted">{formatWhen(n.at)}</p>
                {current ? <p className="mt-1 text-[14px] font-semibold text-brand-text">Reviewing now</p> : (
                  <Link to={n.link} className="mt-1 inline-block text-[14px] font-semibold text-ink underline-offset-4 hover:underline">{n.kind === 'ticket' ? 'View ticket →' : 'Review request →'}</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[14px]">
        <span className="font-semibold text-ink">View all notifications →</span>
        <button type="button" onClick={onMarkAllRead} disabled={unread === 0} className="text-muted underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50">Mark all as read</button>
      </div>
    </Panel>
  );
}
