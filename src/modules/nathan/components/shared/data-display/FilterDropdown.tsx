import { Check, ChevronDown } from 'lucide-react';
import { cx } from '../utils/cx';
import { usePopover } from '../utils/usePopover';

export interface FilterOption {
  value: string;
  label: string;
  /** Optional result count shown beside the label. */
  count?: number;
}

interface BaseProps {
  /** Trigger label, e.g. "Sort" or "Format". */
  label: string;
  options: FilterOption[];
  align?: 'left' | 'right';
  /** Show the selected option's label in the trigger (single mode). */
  showSelected?: boolean;
  className?: string;
}
type SingleProps = { multiple?: false; value: string; onChange: (value: string) => void };
type MultiProps = { multiple: true; value: string[]; onChange: (value: string[]) => void };
export type FilterDropdownProps = BaseProps & (SingleProps | MultiProps);

export function FilterDropdown(props: FilterDropdownProps) {
  const { label, options, align = 'left', showSelected = true, className } = props;
  const { open, toggle, close, rootRef } = usePopover();

  const selected = props.multiple ? props.value : [props.value];
  const current = options.find((o) => o.value === props.value);
  const summary = props.multiple
    ? selected.length ? `${label} (${selected.length})` : label
    : showSelected && current ? current.label : label;

  const pick = (v: string) => {
    if (props.multiple) props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else { props.onChange(v); close(); }
  };

  return (
    <div ref={rootRef} className={cx('relative inline-block', className)}>
      <button type="button" data-popover-trigger aria-haspopup="listbox" aria-expanded={open} onClick={toggle} className="flex items-center gap-2 border-b border-ink/30 pb-1.5 text-[16px] font-semibold text-deep hover:border-ink">
        {!props.multiple && showSelected && <span className="font-normal text-muted">{label}:</span>}
        {summary}
        <ChevronDown size={14} className={cx('transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} aria-multiselectable={props.multiple || undefined} className={cx('absolute z-30 mt-2 min-w-[200px] border border-line bg-white py-1 shadow-[0_8px_24px_rgba(5,32,30,0.12)]', align === 'right' ? 'right-0' : 'left-0')}>
          {options.map((o) => {
            const isSel = selected.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={isSel}>
                <button type="button" onClick={() => pick(o.value)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-[16px] text-deep hover:bg-mint">
                  <span className="grid size-4 place-items-center">{isSel && <Check size={14} aria-hidden />}</span>
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="text-[14px] text-muted">{o.count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
