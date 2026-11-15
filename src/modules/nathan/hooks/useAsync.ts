import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/validation';

interface AsyncState<T> { data: T | null; error: string | null; loading: boolean }

/**
 * Runs `load` whenever `deps` change and exposes loading / error / data.
 * Previous data stays visible while reloading, so lists don't flash empty.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    loadRef.current(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ data, error: null, loading: false }); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((data: T) => setState({ data, error: null, loading: false }), []);
  return { ...state, reload, setData };
}
