import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cx } from '../utils/cx';

export type NavigationItemVariant = 'underline' | 'pill' | 'sidebar' | 'bottom';

export interface NavigationItemProps {
  label: string;
  /** Internal route. */
  to?: string;
  /** External URL. */
  href?: string;
  icon?: ReactNode;
  /** Explicit active state. When omitted it is derived from the current route (`to`). */
  active?: boolean;
  /** Match `to` exactly when deriving the active state. */
  end?: boolean;
  /** Small count or text, e.g. unread items. */
  badge?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  /** `underline` (default) and `pill` for top bars, `sidebar` for vertical nav, `bottom` for mobile tab bars. */
  variant?: NavigationItemVariant;
  /** Sidebar only: hide the label and show the icon alone. */
  collapsed?: boolean;
  className?: string;
}

const base: Record<NavigationItemVariant, { box: string; on: string; off: string }> = {
  underline: { box: 'inline-flex items-center gap-2 border-b-2 py-2 text-[17px] font-semibold', on: 'border-deep text-deep', off: 'border-transparent text-muted hover:text-deep' },
  pill: { box: 'inline-flex items-center gap-2 rounded-full px-5 py-2 text-[16px] font-semibold', on: 'bg-ink text-white', off: 'text-ink/60 hover:text-ink' },
  sidebar: { box: 'flex w-full items-center gap-3 border-l-2 px-4 py-2 text-[17px]', on: 'border-brand font-semibold text-deep', off: 'border-transparent text-ink/70 hover:bg-mint/60 hover:text-deep' },
  bottom: { box: 'flex flex-col items-center gap-1 py-2.5 text-[12px] font-semibold', on: 'text-ink', off: 'text-ink/60' },
};

export function NavigationItem({ label, to, href, icon, active, end, badge, disabled, onClick, variant = 'underline', collapsed, className }: NavigationItemProps) {
  const { pathname } = useLocation();
  const isActive = active ?? (to ? (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)) : false);
  const v = base[variant];
  const classes = cx(v.box, 'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', isActive ? v.on : v.off, disabled && 'pointer-events-none opacity-40', className);

  const inner = (
    <>
      {icon && <span className="shrink-0" aria-hidden>{icon}</span>}
      <span className={cx(collapsed && variant === 'sidebar' && 'sr-only')}>{label}</span>
      {badge !== undefined && badge !== null && !collapsed && <span className="ml-auto rounded-full bg-mint px-2 text-[13px] font-semibold text-ink">{badge}</span>}
    </>
  );
  const aria = { 'aria-current': isActive ? ('page' as const) : undefined, 'aria-disabled': disabled || undefined };

  if (to) return <Link to={to} className={classes} onClick={onClick} {...aria}>{inner}</Link>;
  if (href) return <a href={href} className={classes} onClick={onClick} {...aria}>{inner}</a>;
  return <button type="button" className={classes} onClick={onClick} disabled={disabled} aria-current={aria['aria-current']}>{inner}</button>;
}
