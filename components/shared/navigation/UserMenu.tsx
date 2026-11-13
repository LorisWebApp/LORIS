import { ChevronDown } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '../content/UserAvatar';
import { cx } from '../utils/cx';
import { usePopover } from '../utils/usePopover';

export interface UserMenuAction {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** `danger` for destructive items such as "Sign out". */
  tone?: 'default' | 'danger';
}
export type UserMenuEntry = UserMenuAction | { divider: true };

export interface UserMenuProps {
  user: { name?: string; email?: string; initials?: string; imageUrl?: string };
  items: UserMenuEntry[];
  align?: 'left' | 'right';
  showChevron?: boolean;
  /** Accessible name for the trigger. Defaults to "Account menu". */
  triggerLabel?: string;
  className?: string;
}

const isDivider = (e: UserMenuEntry): e is { divider: true } => 'divider' in e;

export function UserMenu({ user, items, align = 'right', showChevron = true, triggerLabel = 'Account menu', className }: UserMenuProps) {
  const { open, toggle, close, rootRef } = usePopover();

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const nodes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    nodes[(i + (e.key === 'ArrowDown' ? 1 : -1) + nodes.length) % nodes.length]?.focus();
  };

  const itemClass = (tone?: string) => cx('flex w-full items-center gap-3 px-4 py-2 text-left text-[16px] hover:bg-mint focus-visible:bg-mint focus-visible:outline-none', tone === 'danger' ? 'text-rose-text' : 'text-deep');

  return (
    <div ref={rootRef} className={cx('relative', className)} onKeyDown={onKeyDown}>
      <button type="button" data-popover-trigger aria-haspopup="menu" aria-expanded={open} aria-label={triggerLabel} onClick={toggle} className="flex items-center gap-1 rounded-full text-ink">
        <UserAvatar name={user.name} initials={user.initials} imageUrl={user.imageUrl} size="sm" />
        {showChevron && <ChevronDown size={14} aria-hidden />}
      </button>
      {open && (
        <div role="menu" aria-label={triggerLabel} className={cx('absolute z-40 mt-2 min-w-[220px] border border-line bg-white py-1 shadow-[0_8px_24px_rgba(5,32,30,0.12)]', align === 'right' ? 'right-0' : 'left-0')}>
          {(user.name || user.email) && (
            <div className="border-b border-line px-4 py-3">
              {user.name && <p className="text-[17px] font-semibold text-deep">{user.name}</p>}
              {user.email && <p className="text-[14px] text-muted">{user.email}</p>}
            </div>
          )}
          {items.map((entry, i) => {
            if (isDivider(entry)) return <hr key={`d${i}`} role="separator" className="my-1 border-line" />;
            const inner = <>{entry.icon && <span aria-hidden>{entry.icon}</span>}{entry.label}</>;
            const click = () => { entry.onClick?.(); close(); };
            if (entry.to) return <Link key={entry.label} role="menuitem" to={entry.to} onClick={click} className={itemClass(entry.tone)}>{inner}</Link>;
            if (entry.href) return <a key={entry.label} role="menuitem" href={entry.href} onClick={click} className={itemClass(entry.tone)}>{inner}</a>;
            return <button key={entry.label} type="button" role="menuitem" onClick={click} className={itemClass(entry.tone)}>{inner}</button>;
          })}
        </div>
      )}
    </div>
  );
}
