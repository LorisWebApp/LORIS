import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, SectionHeader, StatusBadge } from '../../components/shared';
import { Panel } from '../../components/common/Panel';
import { usePlatformShell } from '../../components/layouts/PlatformLayout';
import { timeAgo } from '../../utils/format';

/** Platform admin: every notification the bell shows, with the unread ones marked. */
export function Notifications() {
  const navigate = useNavigate();
  const { shell, markAllRead } = usePlatformShell();
  const items = shell?.notifications ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title="Notifications" description={unread > 0 ? `${unread} unread` : 'You are all caught up.'} />
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0}>Mark all as read</Button>
      </div>
      <div className="mt-4">
        {items.length === 0 ? (
          <EmptyState title="No notifications yet" description="New requests and support tickets will show up here." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => navigate(n.link)} className="flex w-full items-start justify-between gap-4 py-4 text-left hover:bg-surface/60">
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-deep">{n.headline}</span>
                      {!n.read && <StatusBadge size="sm" label="New" variant="accent" />}
                    </span>
                    <span className="block text-[15px] text-ink/80">{n.label} · {n.detail}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted">{timeAgo(n.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
