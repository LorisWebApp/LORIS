import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface TopbarProps {
  /** Logo / product name, left. */
  brand?: ReactNode;
  /** Primary navigation next to the brand (NavigationItems). */
  navigation?: ReactNode;
  /** Page-level actions (buttons, search). */
  actions?: ReactNode;
  /** User-related controls, far right (NotificationPanel, UserMenu). */
  userControls?: ReactNode;
  tone?: 'light' | 'dark' | 'transparent';
  sticky?: boolean;
  /** Remove the bottom rule. */
  borderless?: boolean;
  /** Replaces the default inner-row classes (`h-16 px-8`) – use it to set height and padding. */
  contentClassName?: string;
  className?: string;
}

export function Topbar({ brand, navigation, actions, userControls, tone = 'light', sticky, borderless, contentClassName, className }: TopbarProps) {
  return (
    <header className={cx(tone === 'dark' ? 'bg-ink text-white' : tone === 'transparent' ? 'text-deep' : 'bg-white text-deep', !borderless && 'border-b border-line', sticky && 'sticky top-0 z-30', className)}>
      <div className={cx('mx-auto flex w-full max-w-[1312px] items-center justify-between gap-6', contentClassName ?? 'h-16 px-8')}>
        <div className="flex min-w-0 items-center gap-6">
          {brand}
          {navigation && <nav aria-label="Primary" className="flex items-center gap-1">{navigation}</nav>}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {actions}
          {userControls}
        </div>
      </div>
    </header>
  );
}
