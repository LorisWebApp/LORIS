/**
 * LORIS Service Worker Registration
 *
 * Registers the service worker once the application loads.
 *
 * Only enabled in production builds.
 * The application remains usable online if registration fails.
 */

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!import.meta.env.PROD) {
    return;
  }

  window.addEventListener(
    "load",
    async () => {
      try {
        const registration =
          await navigator.serviceWorker.register("/service-worker.js");

        console.info(
          "LORIS offline support registered successfully.",
          registration.scope,
        );
      } catch (error) {
        console.error("LORIS offline support could not be registered:", error);
      }
    },
    { once: true },
  );
}
