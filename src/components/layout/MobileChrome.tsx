import { Compass, Library, MessagesSquare, Search, WifiOff } from 'lucide-react';
import { Button, NavigationItem, NotificationPanel, Topbar, UserMenu } from '../shared';
import { LorisLogo } from '../common/LorisLogo';
import { ROUTES, USER_MENU_ITEMS, useCurrentUser, useNotifications } from '../../integration/loris';

/** Mobile top bar: logo, Assistant, search, notifications, account. */
export function MobileTopBar() {
  const user = useCurrentUser();
  const notifications = useNotifications();
  return (
    <Topbar
      tone="transparent"
      borderless
      contentClassName="px-5 pb-2 pt-3"
      brand={<LorisLogo />}
      userControls={
        <div className="flex items-center gap-3 text-ink">
          <NavigationItem to={ROUTES.assistant} label="Assistant" icon={<MessagesSquare size={18} />} variant="bottom" className="!py-0 text-[11px]" />
          <Button to={ROUTES.browse} variant="icon" size="sm" aria-label="Search catalogue"><Search size={18} /></Button>
          <NotificationPanel notifications={notifications} />
          <UserMenu user={{ initials: user.initials }} items={USER_MENU_ITEMS} showChevron={false} />
        </div>
      }
    />
  );
}

const items = [
  { to: ROUTES.browse, label: 'Browse', Icon: Compass },
  { to: ROUTES.myLibrary, label: 'My Library', Icon: Library },
  { to: ROUTES.offlineLibrary, label: 'Offline', Icon: WifiOff },
];

/** Mobile bottom navigation: Browse / My Library / Offline. */
export function MobileBottomNav() {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-xl grid-cols-3">
        {items.map(({ to, label, Icon }) => (
          <NavigationItem key={to} to={to} label={label} icon={<Icon size={18} />} variant="bottom" />
        ))}
      </div>
    </nav>
  );
}
