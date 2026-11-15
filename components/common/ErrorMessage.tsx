import { Alert } from '../shared';

/** Form-level error banner (server or network failures). Renders nothing when there is no message. */
export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Alert severity="error">{message}</Alert>;
}
