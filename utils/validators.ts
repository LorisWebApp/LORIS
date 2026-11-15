/** Each validator returns an error message, or `undefined` when the value is valid. */
export type Validator = (value: string) => string | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const required =
  (label: string): Validator =>
  (value) =>
    value.trim() ? undefined : `${label} is required.`;

export const validEmail: Validator = (value) => {
  if (!value.trim()) return 'Email is required.';
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Enter a valid email address.';
};

/** Runs a map of validators over a map of values and returns only the failures. */
export function validate<T extends Record<string, string>>(
  values: T,
  rules: { [K in keyof T]?: Validator },
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  (Object.keys(rules) as Array<keyof T>).forEach((key) => {
    const message = rules[key]?.(values[key]);
    if (message) errors[key] = message;
  });
  return errors;
}
