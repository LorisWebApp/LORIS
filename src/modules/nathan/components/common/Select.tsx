import { ChevronDown } from 'lucide-react';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cx } from '../shared/utils/cx';

export type SelectOption = string | { value: string; label: string };

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  options: readonly SelectOption[];
  /** Empty first option. Pass `null` to omit it (for fields that always have a value). */
  placeholder?: string | null;
  error?: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, options, placeholder = 'Select…', error, hideLabel, className, id, ...rest }, ref) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={className}>
      <label htmlFor={selectId} className={cx(hideLabel ? 'sr-only' : 'mb-1 block text-[14px] font-medium text-ink')}>{label}</label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cx(
            'h-11 w-full appearance-none rounded-lg bg-mint px-4 pr-10 text-[16px] text-deep',
            'border outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60',
            error ? 'border-rose-text' : 'border-transparent',
          )}
          {...rest}
        >
          {placeholder !== null && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/70" />
      </div>
      {error && <p id={`${selectId}-error`} className="mt-1 text-[14px] text-rose-text">{error}</p>}
    </div>
  );
});
