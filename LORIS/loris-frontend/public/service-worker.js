const CACHE_PREFIX = "loris-app-";
const CACHE_VERSION = "v1";
const APP_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const FALLBACK_DOCUMENT = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(async (cache) => {
      // Cache the application entry point. Vite's built assets are cached
      // as they are requested; authenticated API data is never cached here.
      try {
        await cache.add(FALLBACK_DOCUMENT);
      } catch (error) {
        console.warn("LORIS: app shell could not be precached.", error);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== APP_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls or authenticated application data.
  if (url.pathname.startsWith("/api/")) return;

  // Navigation: network first, then cached app shell for offline SPA startup.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => cache.put(FALLBACK_DOCUMENT, copy));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) || (await caches.match(FALLBACK_DOCUMENT));
        })
    );
    return;
  }

  // Same-origin static assets: cache first, then network and cache successful result.
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        const cache = await caches.open(APP_CACHE);
        await cache.put(request, copy);
      }
      return response;
    })
  );
});
