import { Bell, Compass, Library, MessagesSquare, Search, User, WifiOff } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { LorisLogo } from '../common/LorisLogo';
import { ROUTES } from '../../integration/loris';

/** Mobile top bar: logo, Assistant, search, notifications, avatar. */
export function MobileTopBar({ bg = 'bg-page' }: { bg?: string }) {
  return (
    <header className={`${bg} px-5 pb-2 pt-3`}>
      <div className="flex items-center justify-between">
        <LorisLogo />
        <div className="flex items-center gap-4 text-ink">
          <Link to={ROUTES.assistant} className="flex flex-col items-center text-[10px] font-medium leading-none">
            <MessagesSquare size={18} />
            <span className="mt-1">Assistant</span>
          </Link>
          <Link to={ROUTES.browse} aria-label="Search catalogue">
            <Search size={18} />
          </Link>
          <span className="relative" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand" />
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-deep text-white" aria-label="Account">
            <User size={16} />
          </span>
        </div>
      </div>
    </header>
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
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-3">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
                  isActive ? 'text-ink' : 'text-ink/60'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
