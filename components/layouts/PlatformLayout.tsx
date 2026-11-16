import { BookOpen, ExternalLink, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { getShell, markAllNotificationsRead } from '../../services/platform.service';
import type { PlatformShell } from '../../types/platform';
import type { User } from '../../types/user';
import { LIBRARY_URL, ROUTES } from '../../utils/constants';
import { timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';
import { Alert, LoadingIndicator, NavigationItem, NotificationPanel, Topbar, UserMenu } from '../shared';

interface PlatformTab {
  label: string;
  to: string;
  end?: boolean;
}

const base = ROUTES.platformDashboard;

/** Top row of the Platform Manager navigation. */
export const primaryTabs: PlatformTab[] = [
  { label: 'Overview', to: base, end: true },
  { label: 'Requests', to: `${base}/requests` },
  { label: 'Organisations', to: `${base}/organisations` },
  { label: 'Renewals', to: `${base}/renewals` },
  { label: 'Support tickets', to: `${base}/support-tickets` },
];

/** Second row of the Platform Manager navigation. */
export const secondaryTabs: PlatformTab[] = [
  { label: 'Access management', to: `${base}/access-management` },
  { label: 'Platform users', to: `${base}/platform-users` },
  { label: 'Notifications', to: `${base}/notifications` },
  { label: 'Activity logs', to: `${base}/activity-logs` },
  { label: 'System monitoring', to: `${base}/system-monitoring` },
  { label: 'Library system', to: `${base}/system` },
];

export const allTabs: PlatformTab[] = [...primaryTabs, ...secondaryTabs];

/** What the platform pages receive from the layout (via the router's outlet context). */
export interface PlatformShellContext {
  shell: PlatformShell | null;
  markAllRead: () => void;
}

/** Notifications and unread count shared by the bell and the pages inside the layout. */
export function usePlatformShell(): PlatformShellContext {
  return useOutletContext<PlatformShellContext>();
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function currentTab(pathname: string): PlatformTab {
  const matches = allTabs.filter((tab) => (tab.end ? pathname === tab.to : pathname === tab.to || pathname.startsWith(`${tab.to}/`)));
  return matches.sort((a, b) => b.to.length - a.to.length)[0] ?? primaryTabs[0];
}

function PlatformFrame({ user }: { user: User }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: shell, setData: setShell } = useAsync(getShell, []);
  const [shellNotice, setShellNotice] = useState<string | null>(null);

  const tab = currentTab(pathname);
  const isOverview = tab.to === base;

  const markAllRead = () => {
    markAllNotificationsRead()
      .then(() => setShell((current) => (current ? { notifications: current.notifications.map((n) => ({ ...n, read: true })), unread: 0 } : current)))
      .catch((error: unknown) => setShellNotice(getErrorMessage(error)));
  };

  const signOut = async () => {
    await logout().catch(() => undefined);
    navigate(ROUTES.platformLogin, { replace: true });
  };

  const bellItems = (shell?.notifications ?? []).map((n) => ({
    id: n.id,
    title: n.headline,
    description: `${n.label} · ${n.detail}`,
    time: timeAgo(n.at),
    status: 'info' as const,
    read: n.read,
  }));

  return (
    <div className="min-h-screen bg-mint-soft">
      <div className="h-1 bg-ink" aria-hidden />
      <Topbar
        contentClassName="h-[68px] px-4 sm:px-8"
        brand={
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink text-white" aria-hidden>
              <BookOpen size={20} />
            </span>
            <span className="whitespace-nowrap text-[24px] font-medium text-ink">Loris Web Library</span>
            <span className="hidden text-[13px] font-semibold uppercase tracking-[0.14em] text-muted lg:inline">System admin</span>
          </div>
        }
        navigation={
          <div className="hidden items-center gap-5 md:flex">
            {primaryTabs.map((item) => (
              <NavigationItem key={item.to} label={item.label} to={item.to} end={item.end} />
            ))}
          </div>
        }
        actions={
          LIBRARY_URL ? (
            <a
              href={LIBRARY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center gap-2 rounded-[4px] border border-ink/30 px-3 text-[15px] font-semibold text-deep transition-colors hover:border-ink hover:bg-mint/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:inline-flex"
            >
              View library
              <ExternalLink size={14} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null
        }
        userControls={
          <div className="flex items-center gap-2">
            <NotificationPanel
              notifications={bellItems}
              onMarkAllRead={markAllRead}
              onNotificationClick={(item) => {
                const target = shell?.notifications.find((n) => n.id === item.id);
                if (target) navigate(target.link);
              }}
            />
            <UserMenu
              user={{ name: user.fullName, email: user.email, initials: initialsOf(user.fullName) }}
              items={[{ label: 'Sign out', icon: <LogOut size={16} />, tone: 'danger', onClick: signOut }]}
            />
          </div>
        }
      />
      <div className="hidden border-b border-line bg-white md:block">
        <nav aria-label="More sections" className="mx-auto flex max-w-[1312px] items-center gap-6 px-8 py-1">
          {secondaryTabs.map((item) => (
            <NavigationItem key={item.to} label={item.label} to={item.to} />
          ))}
        </nav>
      </div>
      <div className="border-b border-line bg-white md:hidden">
        <nav aria-label="Sections" className="flex gap-5 overflow-x-auto px-4 py-1">
          {allTabs.map((item) => (
            <NavigationItem key={item.to} label={item.label} to={item.to} end={item.end} className="whitespace-nowrap" />
          ))}
        </nav>
      </div>

      <header className="bg-deep text-white">
        <div className={`mx-auto max-w-[1312px] px-4 sm:px-8 ${isOverview ? 'py-12 sm:py-14' : 'py-8'}`}>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-badge">{isOverview ? 'A space for curious minds' : 'System admin'}</p>
          <h1 className={`m-0 font-medium leading-none tracking-tight ${isOverview ? 'text-[44px] sm:text-[56px]' : 'text-[36px] sm:text-[44px]'}`}>
            {isOverview ? 'System overview' : tab.label}
          </h1>
          {isOverview && <p className="mt-4 text-[19px] text-white/75">A shared library. A growing community.</p>}
        </div>
      </header>

      <main className="mx-auto max-w-[1312px] px-4 py-8 sm:px-8">
        {shellNotice && (
          <Alert severity="error" onDismiss={() => setShellNotice(null)} className="mb-4">
            {shellNotice}
          </Alert>
        )}
        <Outlet context={{ shell, markAllRead } satisfies PlatformShellContext} />
      </main>
    </div>
  );
}

/** Shell for every Platform Manager screen. Only a signed-in Platform Manager gets past it. */
export function PlatformLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingIndicator centered label="Checking your session" className="min-h-screen" />;
  if (!user || user.role !== 'platform_manager') return <Navigate to={ROUTES.platformLogin} replace />;

  return <PlatformFrame user={user} />;
}
