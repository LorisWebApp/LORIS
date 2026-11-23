import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';

/** Paths that already work without a connection, so the prompt is not needed there. */
const OFFLINE_SAFE_PREFIXES = ['/offline-library', '/offline-viewer', '/offline-reader'];

/**
 * Pops up when the device has no internet connection, on page load/refresh or
 * when the user presses something while offline, and offers a one-click switch
 * to the Offline Library.
 */
export function OfflineNotice() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [dismissed, setDismissed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const onOfflineSafePage = OFFLINE_SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const visible = !online && !dismissed && !onOfflineSafePage;

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setDismissed(false);
    };
    const goOffline = () => {
      setOnline(false);
      setDismissed(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // A press on a button or link while offline brings the prompt back.
  useEffect(() => {
    if (online || !dismissed) return;
    const onPress = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, [role="button"]')) setDismissed(false);
    };
    document.addEventListener('click', onPress, true);
    return () => document.removeEventListener('click', onPress, true);
  }, [online, dismissed]);

  useEffect(() => {
    if (visible) dialogRef.current?.focus();
  }, [visible]);

  const openOfflineLibrary = useCallback(() => {
    setDismissed(true);
    navigate('/offline-library');
  }, [navigate]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="offline-notice-title"
        aria-describedby="offline-notice-text"
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl outline-none"
      >
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-mint text-deep">
          <WifiOff size={24} aria-hidden="true" />
        </div>
        <h2 id="offline-notice-title" className="text-xl font-semibold text-deep">
          No internet connection
        </h2>
        <p id="offline-notice-text" className="mt-2 text-[15px] text-deep/80">
          You can’t reach LORIS right now. Your saved books are still available offline.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={openOfflineLibrary}
            className="rounded-md bg-deep px-5 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Switch to Offline Library
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md border border-line px-5 py-2.5 font-semibold text-deep hover:bg-mint"
          >
            Stay here
          </button>
        </div>
      </div>
    </div>
  );
}

export default OfflineNotice;
