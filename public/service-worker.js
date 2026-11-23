const CACHE_PREFIX = "loris-app-";
const CACHE_VERSION = "v2";
const APP_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const FALLBACK_DOCUMENT = "/";

// Files that make up the app shell (the HTML plus the JS/CSS it loads) must all be cached,
// otherwise an offline reload shows a blank page: the HTML loads but the app cannot start.
const ASSET_PATTERN = /(?:src|href)=["'](\/[^"'#?]+\.(?:js|mjs|css|svg|png|jpe?g|ico|webmanifest|woff2?))["']/g;

async function precacheAppShell() {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(FALLBACK_DOCUMENT, { cache: "reload" });
    if (!response.ok) throw new Error(`Shell request failed (${response.status})`);
    const html = await response.clone().text();
    await cache.put(FALLBACK_DOCUMENT, response);

    const assets = new Set(["/manifest.webmanifest", "/favicon.svg"]);
    for (const match of html.matchAll(ASSET_PATTERN)) assets.add(match[1]);

    await Promise.all(
      [...assets].map(async (path) => {
        try {
          const asset = await fetch(path, { cache: "reload" });
          if (asset.ok) await cache.put(path, asset);
        } catch (error) {
          console.warn("LORIS: could not precache", path, error);
        }
      })
    );
  } catch (error) {
    console.warn("LORIS: app shell could not be precached.", error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
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

  // Connectivity probe: always hit the network so a dead connection is detected.
  if (url.pathname === "/__ping") {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Never cache API calls or authenticated application data.
  if (url.pathname.startsWith("/api/")) return;

  // Navigation (including a refresh on any app route): network first, then the cached app shell
  // so the single-page app can start offline and show its own offline prompt.
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
        .catch(async () => (await caches.match(FALLBACK_DOCUMENT)) || Response.error())
    );
    return;
  }

  // Same-origin static assets: cache first, then network and cache the successful result.
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
