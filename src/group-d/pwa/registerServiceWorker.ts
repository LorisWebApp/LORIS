export interface ServiceWorkerRegistrationOptions {
  /** Register only in production by default. */
  productionOnly?: boolean;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: unknown) => void;
}

export function registerServiceWorker(
  options: ServiceWorkerRegistrationOptions = {}
): void {
  const { productionOnly = true, onRegistered, onError } = options;

  if (!("serviceWorker" in navigator)) return;

  // Vite exposes import.meta.env.PROD. This check avoids registering a stale
  // worker while developing with the Vite dev server.
  const isProduction =
    typeof import.meta !== "undefined" &&
    Boolean((import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD);

  if (productionOnly && !isProduction) return;

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => onRegistered?.(registration))
        .catch((error) => {
          onError?.(error);
          if (!onError) console.error("LORIS service worker registration failed:", error);
        });
    },
    { once: true }
  );
}
