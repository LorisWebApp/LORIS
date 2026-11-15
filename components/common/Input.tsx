import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Button } from './Button';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  /** Validation or server message for this field. */
  error?: string;
  /** Helper text shown under the field while it has no error. */
  hint?: string;
}

/** Labelled text field in the shared theme. Password fields get a show/hide toggle. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, id, type = 'text', required, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-[15px] font-medium text-deep">
        {label}
        {required && <span aria-hidden className="text-rose-text"> *</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`h-11 w-full rounded-[4px] border bg-mint px-3 text-[17px] text-deep outline-none transition-colors placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60 ${
            error ? 'border-rose-text' : 'border-transparent'
          } ${isPassword ? 'pr-11' : ''}`}
          {...rest}
        />
        {isPassword && (
          <Button
            variant="icon"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </Button>
        )}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-[14px] ${error ? 'text-rose-text' : 'text-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
