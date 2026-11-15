import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabNavigationProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** `underline` = editorial default, `pill` = filled selection for filter rows. */
  variant?: 'underline' | 'pill';
  'aria-label': string;
  className?: string;
}

export function TabNavigation({ tabs, activeId, onChange, variant = 'underline', className, ...rest }: TabNavigationProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    const enabled = tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === activeId);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? enabled.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    e.preventDefault();
    onChange(enabled[next].id);
    listRef.current?.querySelectorAll<HTMLElement>('[role=tab]:not([disabled])')[next]?.focus();
  };

  return (
    <div ref={listRef} role="tablist" aria-label={rest['aria-label']} onKeyDown={onKeyDown} className={cx('flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', variant === 'underline' ? 'gap-6 border-b border-line' : 'gap-2', className)}>
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id} role="tab" type="button" aria-selected={active} tabIndex={active ? 0 : -1} disabled={t.disabled} onClick={() => onChange(t.id)}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[16px] font-semibold transition-colors disabled:opacity-40',
              variant === 'underline'
                ? cx('-mb-px border-b-2 pb-2.5', active ? 'border-deep text-deep' : 'border-transparent text-muted hover:text-deep')
                : cx('rounded-full px-4 py-1.5', active ? 'bg-deep text-white' : 'bg-mint text-ink/80 hover:bg-line'),
            )}
          >
            {t.icon}{t.label}{t.count !== undefined && <span className={cx('font-normal', active ? 'opacity-80' : 'text-muted')}>({t.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
