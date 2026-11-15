import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cx } from '../shared/utils/cx';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

/** Labelled multi-line field, styled to match `Input`. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, id, rows = 4, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1 block text-[14px] font-medium text-ink">{label}</label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'w-full resize-y rounded-lg bg-mint p-3 text-[16px] text-deep placeholder:text-muted/70',
          'border outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60',
          error ? 'border-rose-text' : 'border-transparent',
        )}
        {...rest}
      />
      {error ? <p id={`${fieldId}-error`} className="mt-1 text-[14px] text-rose-text">{error}</p>
        : hint ? <p id={`${fieldId}-hint`} className="mt-1 text-[14px] text-muted">{hint}</p> : null}
    </div>
  );
});
