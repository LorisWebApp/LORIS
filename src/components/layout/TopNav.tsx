import { NavigationItem, NotificationPanel, Topbar, UserMenu } from '../shared';
import { LorisLogo } from '../common/LorisLogo';
import { ROUTES, USER_MENU_ITEMS, useCurrentUser, useNotifications } from '../../integration/loris';

const links = [
  { to: ROUTES.browse, label: 'Browse' },
  { to: ROUTES.myLibrary, label: 'My library' },
  { to: ROUTES.offlineLibrary, label: 'Offline Library' },
  { to: ROUTES.assistant, label: 'Assistant' },
];

/** Desktop top navigation, composed from the shared Topbar. */
export function TopNav() {
  const user = useCurrentUser();
  const notifications = useNotifications();
  return (
    <Topbar
      borderless
      contentClassName="h-20 px-8"
      brand={<LorisLogo />}
      navigation={
        <div className="flex items-center gap-1 rounded-full bg-mint p-1">
          {links.map((l) => <NavigationItem key={l.to} {...l} variant="pill" />)}
        </div>
      }
      userControls={
        <>
          <NotificationPanel notifications={notifications} />
          <UserMenu user={{ initials: user.initials }} items={USER_MENU_ITEMS} />
        </>
      }
    />
  );
}
