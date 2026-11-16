import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled multi-line field in the shared theme. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, id, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-[15px] font-medium text-deep">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={`w-full rounded-[4px] border bg-mint px-3 py-2 text-[17px] text-deep outline-none transition-colors placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60 ${
          error ? 'border-rose-text' : 'border-transparent'
        }`}
        {...rest}
      />
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-[14px] ${error ? 'text-rose-text' : 'text-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
