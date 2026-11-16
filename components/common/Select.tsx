import { ChevronDown } from 'lucide-react';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  options: SelectOption[];
  /** Text of an empty first option. Pass `null` for no placeholder option. */
  placeholder?: string | null;
  error?: string;
  hint?: string;
}

/** Labelled native select in the shared theme. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, options, placeholder = 'Select…', error, hint, id, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-[15px] font-medium text-deep">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`h-11 w-full appearance-none rounded-[4px] border bg-mint pl-3 pr-10 text-[17px] text-deep outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60 ${
            error ? 'border-rose-text' : 'border-transparent'
          }`}
          {...rest}
        >
          {placeholder !== null && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-[14px] ${error ? 'text-rose-text' : 'text-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
