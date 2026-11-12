import { Bell, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { LorisLogo } from '../common/LorisLogo';
import { ROUTES, useCurrentUser } from '../../integration/loris';

const links = [
  { to: ROUTES.browse, label: 'Browse' },
  { to: ROUTES.myLibrary, label: 'My library' },
  { to: ROUTES.offlineLibrary, label: 'Offline Library' },
  { to: ROUTES.assistant, label: 'Assistant' },
];

/** Desktop top navigation (white bar, pill nav group). */
export function TopNav() {
  const user = useCurrentUser();
  return (
    <header className="bg-white">
      <div className="mx-auto flex h-20 max-w-[1312px] items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <LorisLogo />
          <nav className="flex items-center gap-1 rounded-full bg-mint p-1" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <span className="relative text-ink" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand" />
          </span>
          <span className="flex items-center gap-1 text-ink" aria-label="Account">
            <span className="grid size-8 place-items-center rounded-full bg-deep text-[11px] font-semibold text-white">
              {user.initials}
            </span>
            <ChevronDown size={14} />
          </span>
        </div>
      </div>
    </header>
  );
}
