import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { cx } from '../shared/utils/cx';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
  /** Password inputs get a show/hide toggle. */
  className?: string;
}

/** Labelled text field in the auth-screen style (mint fill, small label above). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, type = 'text', className, id, ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-[14px] font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            'h-11 w-full rounded-lg bg-mint px-4 text-[16px] text-deep placeholder:text-muted/70',
            'border outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30',
            'disabled:opacity-60',
            error ? 'border-rose-text' : 'border-transparent',
            isPassword && 'pr-11',
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-ink/70 hover:text-deep focus-visible:outline-2 focus-visible:outline-brand"
          >
            {revealed ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-[14px] text-rose-text">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-[14px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
