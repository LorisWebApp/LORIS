import type { ReactNode } from 'react';
import { ErrorState, LoadingIndicator } from '../shared';

interface AsyncViewProps<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/** Loading spinner on first load, an error with retry if nothing could be loaded, otherwise the content. */
export function AsyncView<T>({ data, loading, error, onRetry, loadingLabel = 'Loading…', children }: AsyncViewProps<T>) {
  if (data) return <>{children(data)}</>;
  if (error) return <ErrorState message={error} onRetry={onRetry} retrying={loading} />;
  return <LoadingIndicator centered label={loadingLabel} />;
}
