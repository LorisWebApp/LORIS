import type { ReactNode } from 'react';
import { ErrorState, LoadingIndicator } from '../shared';

interface AsyncViewProps<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/** Shows an error (with retry), a loading indicator, or the content once data has arrived. */
export function AsyncView<T>({ data, loading, error, onRetry, loadingLabel = 'Loading…', children }: AsyncViewProps<T>) {
  if (error) return <ErrorState message={error} onRetry={onRetry} retrying={loading} />;
  if (data === null) return <LoadingIndicator centered label={loadingLabel} />;
  return <>{children(data)}</>;
}
