import { Link } from 'react-router-dom';
import { Button, EmptyState, SectionHeader } from '../shared';
import type { PlatformNotification } from '../../types/platform';
import { timeAgo } from '../../utils/format';
import { Panel } from '../common/Panel';

interface NotificationsAsideProps {
  notifications: PlatformNotification[];
  unread: number;
  /** Path of the page being viewed; its notification is marked as current. */
  currentLink?: string;
  onMarkAllRead: () => void;
}

/** Side panel listing the latest notifications next to a detail page. */
export function NotificationsAside({ notifications, unread, currentLink, onMarkAllRead }: NotificationsAsideProps) {
  return (
    <Panel as="aside" className="p-6">
      <SectionHeader as="h2" size="sm" title="Notifications" actions={unread > 0 ? <Button variant="text" size="sm" onClick={onMarkAllRead}>Mark all read</Button> : undefined} />
      {notifications.length === 0 ? (
        <EmptyState title="Nothing new" description="New requests and tickets appear here." />
      ) : (
        <ul className="mt-3 list-none divide-y divide-line p-0">
          {notifications.slice(0, 5).map((n) => (
            <li key={n.id} className="py-3">
              <Link to={n.link} aria-current={n.link === currentLink ? 'page' : undefined} className="block hover:underline">
                <p className={`text-[16px] text-deep ${n.read ? '' : 'font-semibold'}`}>{n.headline}</p>
                <p className="text-[14px] text-muted">
                  {n.label} · {timeAgo(n.at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
