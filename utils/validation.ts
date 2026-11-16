import { ApiError } from '../services/api';

/** Field name to message, as used by forms. */
export type FieldErrors = Record<string, string>;

/** A readable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
