import { useCallback, useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react';
import { getErrorMessage } from '../utils/validation';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Runs the request again. */
  reload: () => void;
  /** Replace the data (e.g. with the response of an update). */
  setData: Dispatch<SetStateAction<T | null>>;
}

/**
 * Runs `load` on mount and whenever `deps` change, cancelling the previous request.
 * Previous data stays available while the next request is in flight.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    load(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { data, loading, error, reload, setData };
}
