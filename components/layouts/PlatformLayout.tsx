import { BookOpen, Bell, ExternalLink, LogOut } from 'lucide-react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LIBRARY_URL, ROUTES } from '../../utils/constants';
import { Button } from '../common/Button';
import { LoadingIndicator, NavigationItem, Topbar, UserMenu } from '../shared';

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
  { label: 'Library system', to: `${base}/library-system` },
];

export const allTabs: PlatformTab[] = [...primaryTabs, ...secondaryTabs];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Shell for every Platform Manager screen. Only a signed-in Platform Manager gets past it. */
export function PlatformLayout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingIndicator centered label="Checking your session" className="min-h-screen" />;
  if (!user || user.role !== 'platform_manager') return <Navigate to={ROUTES.platformLogin} replace />;

  const signOut = async () => {
    await logout().catch(() => undefined);
    navigate(ROUTES.platformLogin, { replace: true });
  };

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
            {primaryTabs.map((tab) => (
              <NavigationItem key={tab.to} label={tab.label} to={tab.to} end={tab.end} />
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
            <Button variant="icon" to={`${base}/notifications`} aria-label="Notifications">
              <Bell size={18} aria-hidden />
            </Button>
            <UserMenu
              user={{ name: user.fullName, email: user.email, initials: initialsOf(user.fullName) }}
              items={[{ label: 'Sign out', icon: <LogOut size={16} />, tone: 'danger', onClick: signOut }]}
            />
          </div>
        }
      />
      <div className="hidden border-b border-line bg-white md:block">
        <nav aria-label="More sections" className="mx-auto flex max-w-[1312px] items-center gap-6 px-8 py-1">
          {secondaryTabs.map((tab) => (
            <NavigationItem key={tab.to} label={tab.label} to={tab.to} />
          ))}
        </nav>
      </div>
      <div className="border-b border-line bg-white md:hidden">
        <nav aria-label="Sections" className="flex gap-5 overflow-x-auto px-4 py-1">
          {allTabs.map((tab) => (
            <NavigationItem key={tab.to} label={tab.label} to={tab.to} end={tab.end} className="whitespace-nowrap" />
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
