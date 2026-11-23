import { useCallback, useEffect, useRef, useState } from 'react';

const PROBE_PATH = '/__ping';
const PROBE_INTERVAL_MS = 15000;
const PROBE_TIMEOUT_MS = 4000;

/**
 * Real connectivity, not just the browser flag. `navigator.onLine` stays true on a
 * connection that is up but has no internet (hotel Wi-Fi, a dead VPN), so we also
 * ping our own host (the service worker never caches this path) and treat a failed
 * ping as offline.
 */
export function useConnectivity(): { online: boolean; recheck: () => void } {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const mounted = useRef(true);

  const probe = useCallback(async () => {
    if (!navigator.onLine) {
      if (mounted.current) setOnline(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const response = await fetch(`${PROBE_PATH}?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (mounted.current) setOnline(response.status > 0);
    } catch {
      if (mounted.current) setOnline(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void probe();

    const onOnline = () => void probe();
    const onOffline = () => setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void probe();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    const interval = window.setInterval(() => void probe(), PROBE_INTERVAL_MS);

    return () => {
      mounted.current = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [probe]);

  return { online, recheck: () => void probe() };
}
