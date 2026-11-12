import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { NavigationItem, type NavigationItemProps } from './NavigationItem';

export interface SidebarEntry extends Omit<NavigationItemProps, 'variant' | 'collapsed' | 'className'> {
  id: string;
  /** Show only to these roles. Omit for everyone. */
  roles?: string[];
}

export interface SidebarSection {
  id: string;
  title?: string;
  entries: SidebarEntry[];
  /** Show the whole section only to these roles. */
  roles?: string[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  /** The current user's role. Entries and sections restricted to other roles are hidden. */
  role?: string;
  brand?: ReactNode;
  /** Content pinned to the bottom (user summary, help link…). */
  footer?: ReactNode;
  collapsed?: boolean;
  'aria-label'?: string;
  className?: string;
}

const visible = (roles: string[] | undefined, role: string | undefined) => !roles || (role !== undefined && roles.includes(role));

export function Sidebar({ sections, role, brand, footer, collapsed, className, ...rest }: SidebarProps) {
  const shown = sections
    .filter((s) => visible(s.roles, role))
    .map((s) => ({ ...s, entries: s.entries.filter((e) => visible(e.roles, role)) }))
    .filter((s) => s.entries.length > 0);

  return (
    <aside className={cx('flex h-full flex-col border-r border-line bg-white', collapsed ? 'w-[72px]' : 'w-[260px]', className)}>
      {brand && <div className="px-5 py-6">{brand}</div>}
      <nav aria-label={rest['aria-label'] ?? 'Sidebar'} className="flex-1 space-y-7 overflow-y-auto py-2">
        {shown.map((s) => (
          <div key={s.id}>
            {s.title && !collapsed && <p className="mb-2 px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">{s.title}</p>}
            <ul className="m-0 list-none p-0">
              {s.entries.map(({ id, roles: _roles, ...item }) => {
                void _roles;
                return <li key={id}><NavigationItem {...item} variant="sidebar" collapsed={collapsed} /></li>;
              })}
            </ul>
          </div>
        ))}
      </nav>
      {footer && <div className="border-t border-line p-5">{footer}</div>}
    </aside>
  );
}
