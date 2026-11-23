import { Link } from 'react-router-dom';
import { WifiOff } from 'lucide-react';

/** Shown in place of a page that needs the internet. It makes no network requests. */
export function OfflinePage({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-mint text-deep">
          <WifiOff size={26} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-deep">Currently not connected to the internet</h1>
        <p className="mt-2 text-[15px] text-deep/80">
          This page needs a connection. Reconnect to continue, or read the titles you saved on this device.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/offline-library"
            className="rounded-md bg-deep px-5 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Open Offline Library
          </Link>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-line px-5 py-2.5 font-semibold text-deep hover:bg-mint"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default OfflinePage;
