import { ApiError } from '../services/http';

export type FieldErrors = Record<string, string>;

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Client-side hint only: align with the backend password policy once confirmed. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirm your password.';
  return password === confirm ? null : 'Passwords do not match.';
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof ApiError || err instanceof Error ? err.message || fallback : fallback;
}
