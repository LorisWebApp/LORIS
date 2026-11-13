import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Button, NavigationItem, NotificationPanel, PageHeader, Topbar, type NotificationItem } from '../shared';
import { useAsync } from '../../hooks/useAsync';
import { ROUTES } from '../../routes/paths';
import { PLATFORM_CHANGED_EVENT, getShell, markAllNotificationsRead } from '../../services/platform.service';
import type { PlatformShell } from '../../types/platform';
import { timeAgo } from '../../utils/format';
import { AccountControls } from './AccountControls';
import { AppFooter } from './AppFooter';
import { BrandMark } from './BrandMark';

const HEADERS: Array<{ prefix: string; title: string; description: string }> = [
  { prefix: '/platform/requests/', title: 'Review organisation', description: 'Review the details before granting library access.' },
  { prefix: '/platform/requests', title: 'Organisation requests', description: 'Welcome new communities into the library.' },
  { prefix: '/platform/organisations', title: 'Organisations', description: 'Every community that shares this library.' },
  { prefix: '/platform/tickets', title: 'Support tickets', description: 'Help every community keep discovering.' },
  { prefix: '/platform/system', title: 'Library system', description: 'Manage the library with care and confidence.' },
  { prefix: '/platform', title: 'System overview', description: 'A shared library. A growing community.' },
];

export interface PlatformShellContext {
  shell: PlatformShell | null;
  markAllRead: () => void;
}
export const usePlatformShell = () => useOutletContext<PlatformShellContext>();

/** Shell for platform administrators: top bar, dark page header, section tabs, footer. */
export function PlatformLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: shell, reload } = useAsync(getShell, []);

  // Refresh badges and the bell after any change made on a platform screen.
  useEffect(() => {
    window.addEventListener(PLATFORM_CHANGED_EVENT, reload);
    return () => window.removeEventListener(PLATFORM_CHANGED_EVENT, reload);
  }, [reload]);

  const markAllRead = useCallback(() => { void markAllNotificationsRead(); }, []);
  // HEADERS is ordered most-specific first, so the first prefix match wins.
  const header = HEADERS.find((h) => pathname.startsWith(h.prefix)) ?? HEADERS[HEADERS.length - 1];

  const items = useMemo<NotificationItem[]>(() => (shell?.notifications ?? []).map((n) => ({
    id: n.id, title: n.headline, description: `${n.label} · ${n.detail}`, time: timeAgo(n.at), status: n.kind === 'ticket' ? 'warning' : 'info', read: n.read,
  })), [shell]);

  const ctx: PlatformShellContext = { shell, markAllRead };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      <Topbar
        brand={<BrandMark to={ROUTES.platform} label="System admin" />}
        actions={<Button to={ROUTES.library} variant="outline" size="sm" rightIcon={<ExternalLink size={14} aria-hidden />}>View library</Button>}
        userControls={
          <>
            <NotificationPanel
              notifications={items}
              onMarkAllRead={markAllRead}
              onNotificationClick={(n) => { const target = shell?.notifications.find((x) => x.id === n.id); if (target) navigate(target.link); }}
            />
            <AccountControls />
          </>
        }
      />
      <PageHeader tone="dark" size="md" eyebrow="A space for curious minds" title={header.title} description={header.description} className="px-8 py-10" />
      <div className="border-b border-line bg-white">
        <nav aria-label="Platform sections" className="mx-auto flex max-w-[1312px] gap-8 overflow-x-auto px-8">
          <NavigationItem label="Overview" to={ROUTES.platform} end />
          <NavigationItem label="Requests" to="/platform/requests" badge={shell && shell.pendingRequests > 0 ? shell.pendingRequests : undefined} />
          <NavigationItem label="Organisations" to="/platform/organisations" />
          <NavigationItem label="Support tickets" to="/platform/tickets" />
          <NavigationItem label="Library system" to="/platform/system" />
        </nav>
      </div>
      <main id="main" className="mx-auto w-full max-w-[1312px] flex-1 px-8 py-8">
        <Outlet context={ctx} />
      </main>
      <AppFooter
        left="© 2026 Loris Web Library · Administration"
        right={<span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-brand" aria-hidden />All systems operational</span>}
      />
    </div>
  );
}

