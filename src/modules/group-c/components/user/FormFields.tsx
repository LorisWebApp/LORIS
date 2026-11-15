import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { cx } from "./sharedUi";

/**
 * Text inputs styled with the shared design tokens.
 * The shared library does not currently provide form input components.
 */

interface FieldBase {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

const control =
  "w-full rounded-[4px] border bg-white px-3 py-2 text-[16px] text-deep outline-none transition-colors placeholder:text-muted focus:border-ink disabled:bg-mint disabled:text-muted";

function getDescription(error?: string, hint?: string) {
  return error || hint;
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...rest
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const description = getDescription(error, hint);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        {label}
      </label>

      <input
        {...rest}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cx(control, error ? "border-rose-text" : "border-ink/30")}
      />

      {description && (
        <p
          id={`${id}-description`}
          className={cx(
            "mt-1 text-[14px]",
            error ? "text-rose-text" : "text-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...rest
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const description = getDescription(error, hint);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        {label}
      </label>

      <textarea
        {...rest}
        id={id}
        rows={rest.rows ?? 5}
        aria-invalid={Boolean(error)}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cx(
          control,
          "resize-y",
          error ? "border-rose-text" : "border-ink/30",
        )}
      />

      {description && (
        <p
          id={`${id}-description`}
          className={cx(
            "mt-1 text-[14px]",
            error ? "text-rose-text" : "text-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps
  extends
    FieldBase,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  options: { value: string; label: string }[];
}

export function SelectField({
  label,
  error,
  hint,
  className,
  options,
  ...rest
}: SelectFieldProps) {
  const id = useId();
  const description = getDescription(error, hint);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        {label}
      </label>

      <select
        {...rest}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cx(control, error ? "border-rose-text" : "border-ink/30")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {description && (
        <p
          id={`${id}-description`}
          className={cx(
            "mt-1 text-[14px]",
            error ? "text-rose-text" : "text-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Segmented single-choice control (radio group). */
export function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  hint,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  const name = useId();

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-1 p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
        {legend}
      </legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              "cursor-pointer rounded-[4px] border px-3 py-1.5 text-[16px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand",
              option.value === value
                ? "border-deep bg-deep text-white"
                : "border-ink/30 bg-white text-deep hover:bg-mint",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>

      {hint && <p className="mt-1 text-[14px] text-muted">{hint}</p>}
    </fieldset>
  );
}

/** Labelled on/off switch. */
export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[17px] text-deep">{label}</span>

        {description && (
          <span className="block text-[14px] text-muted">{description}</span>
        )}
      </label>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          checked ? "bg-brand" : "bg-ink/25",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
