// public/service-worker.js
//
// LORIS service worker (Group D, Task 1: App Shell Caching)
//
// What it does:
//   1. On install: caches the app shell ("/"), plus the JS, CSS and module
//      preloads that the production index.html references.
//   2. On activate: deletes older "loris-app-*" caches.
//   3. On fetch:
//        - page navigations: network first, cached shell when offlines
//        - static assets: cache first, cached after the first successful load
//        - everything else (API, auth, external, non-GET, range): untouched
//
// Not in scope here: offline detection, IndexedDB PDF storage, chatbot, sync.

const CACHE_PREFIX = 'loris-app-';
const CACHE_NAME = 'loris-app-v2'; // bump whenever the caching logic changes
const SHELL_URL = '/';             // SPA entry point, also the offline fallback

// Verified files in /public. Cached best-effort: a failure never blocks install.
const STATIC_FILES = ['/favicon.svg', '/icons.svg', '/manifest.webmanifest'];

// Request types that may be cached at runtime. fetch() calls (API, Supabase,
// PDFs) have an empty destination, so they never match and are never stored.
const CACHEABLE_DESTINATIONS = new Set(['script', 'style', 'font', 'image', 'manifest', 'worker']);

// Paths that are never cached at runtime: API, auth, and Vite dev-server paths.
// Change '/api/' if the backend uses another prefix on this origin.
const NEVER_CACHE_PREFIXES = ['/api/', '/auth/', '/@', '/src/', '/node_modules/'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A response is safe to store if it is a plain, successful, same-origin
// response that does not forbid caching.
function isSafeToCache(res) {
  if (!res || res.status !== 200 || res.type !== 'basic') return false;
  return !/no-store|private/i.test(res.headers.get('Cache-Control') || '');
}

// Reads one attribute from a single HTML tag (double-quoted, single-quoted or bare).
function getAttr(tag, name) {
  const re = new RegExp('\\s' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
  const m = re.exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null;
}

// Returns "/path?query" for same-origin URLs, or null for anything else.
// This is what keeps external URLs out of the precache.
function toSameOriginPath(raw, base) {
  try {
    const u = new URL(raw, base || self.location.origin);
    return u.origin === self.location.origin ? u.pathname + u.search : null;
  } catch {
    return null;
  }
}

// Reads the shell HTML and sorts what it references:
//   essential: scripts, stylesheets, modulepreloads (the app cannot start without them)
//   optional:  icon links
//   manifestPath: the web app manifest, whose icons are read separately
// File names are never guessed, because Vite changes the hashes on every build.
function parseShell(html) {
  const essential = new Set();
  const optional = new Set();
  let manifestPath = null;

  const tags = html.match(/<(?:script|link)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (/^<script/i.test(tag)) {
      const src = getAttr(tag, 'src');
      const path = src && toSameOriginPath(src);
      if (path && /\.m?js$/i.test(path.split('?')[0])) essential.add(path);
      continue;
    }

    const href = getAttr(tag, 'href');
    const path = href && toSameOriginPath(href);
    if (!path) continue;
    const rel = (getAttr(tag, 'rel') || '').toLowerCase().split(/\s+/);

    if (rel.includes('stylesheet') || rel.includes('modulepreload')) essential.add(path);
    else if (rel.includes('manifest')) manifestPath = path;
    else if (rel.includes('icon') || rel.includes('apple-touch-icon')) optional.add(path);
  }
  return { essential: [...essential], optional: [...optional], manifestPath };
}

// Icon paths declared in the real manifest file (never guessed).
// Any failure returns an empty list, because icons are optional.
async function manifestIconPaths(manifestPath) {
  try {
    const res = await fetch(manifestPath);
    if (!res.ok) return [];
    const manifest = await res.json();
    const base = new URL(manifestPath, self.location.origin).href;
    return (manifest.icons || []).map((i) => toSameOriginPath(i.src, base)).filter(Boolean);
  } catch {
    return [];
  }
}

// Fetches, checks and caches one ESSENTIAL file. Any problem throws, which
// makes installation fail, so the previous worker and cache stay in control.
// Rejected: non-200, redirects, cross-origin responses, HTML in place of a
// file (an SPA host answers missing files with index.html), a wrong content
// type for .js/.css, and empty bodies. A missing Content-Type header is
// tolerated, but the other checks still apply.
async function cacheEssential(cache, path) {
  const res = await fetch(path);

  if (res.status !== 200) {
    throw new Error(`Essential asset failed: $DIL1 ($DIL2)`);
  }
  if (res.redirected) {
    throw new Error(`Essential asset was redirected: $DIL3`);
  }
  if (res.type !== 'basic') {
    throw new Error(`Essential asset is not same-origin: $DIL4`);
  }

  const type = (res.headers.get('Content-Type') || '').toLowerCase();
  if (type.includes('text/html')) {
    throw new Error(`Essential asset returned HTML instead of a file: $DIL5`);
  }

  const pathname = path.split('?')[0];
  if (/\.m?js$/i.test(pathname) && type && !/javascript|ecmascript/.test(type)) {
    throw new Error(`Essential script has an invalid content type ($DIL6): $DIL7`);
  }
  if (/\.css$/i.test(pathname) && type && !type.includes('text/css')) {
    throw new Error(`Essential stylesheet has an invalid content type ($DIL8): $DIL9`);
  }

  const body = await res.clone().blob();
  if (body.size === 0) {
    throw new Error(`Essential asset is empty: $DIL10`);
  }

  await cache.put(path, res);
}

// Install-time precache: shell first, then its essential assets, then extras.
async function precacheShell(cache) {
  // 1. The HTML entry point is required. cache: 'reload' bypasses the browser's
  //    HTTP cache, so the HTML references the current bundles.
  const res = await fetch(SHELL_URL, { cache: 'reload' });
  const type = res.headers.get('Content-Type') || '';
  if (!res.ok || res.redirected || !type.includes('text/html')) {
    throw new Error(`Shell fetch failed ($DIL11)`);
  }
  const html = await res.clone().text();
  await cache.put(SHELL_URL, res);

  // 2. Its JS, CSS and modulepreloads are required. Any failure fails the install.
  const { essential, optional, manifestPath } = parseShell(html);
  if (essential.length === 0) {
    throw new Error('No application scripts found in the shell HTML');
  }
  await Promise.all(essential.map((p) => cacheEssential(cache, p)));

  // 3. Icons, the manifest and the verified public files are best-effort.
  //    allSettled means one missing file cannot block installation.
  const extras = new Set([...optional, ...STATIC_FILES]);
  if (manifestPath) {
    extras.add(manifestPath);
    (await manifestIconPaths(manifestPath)).forEach((p) => extras.add(p));
  }
  await Promise.allSettled([...extras].map((p) => cache.add(p)));
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(precacheShell)
      .then(() => self.skipWaiting()) // existing behaviour, kept
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Only LORIS caches, and never the current one.
            .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // existing behaviour, kept
  );
});

// ---------------------------------------------------------------------------
// Fetch handling
// ---------------------------------------------------------------------------

// Network first for page loads. A good HTML response refreshes the cached
// shell, so it keeps pointing at the newest bundles. When offline, the
// cached shell is returned for HTML requests.
async function handleNavigation(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    const isHtml = (res.headers.get('Content-Type') || '').includes('text/html');
    // Redirected responses are skipped: browsers reject them for navigations.
    if (isSafeToCache(res) && isHtml && !res.redirected) {
      try {
        await cache.put(SHELL_URL, res.clone());
      } catch {
        // A failed cache write (e.g. storage quota) must not fail the page.
      }
    }
    return res;
  } catch {
    if ((req.headers.get('Accept') || '').includes('text/html')) {
      const shell = await cache.match(SHELL_URL);
      if (shell) return shell;
    }
    return new Response('You are offline and LORIS has not been loaded on this device yet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Cache first for static assets. Anything not cached yet is fetched from the
// network and stored if the response is safe.
async function handleAsset(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  if (isSafeToCache(res)) {
    try {
      await cache.put(req, res.clone());
    } catch {
      // A failed cache write (e.g. storage quota) must not fail the request.
    }
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only GET requests are ever handled.
  if (req.method !== 'GET') return;

  // Cross-origin requests (Supabase, Cloudflare R2, fonts CDNs) are untouched.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: network first, cached shell offline.
  if (req.mode === 'navigate') {
    if (url.pathname.startsWith('/api/')) return;
    event.respondWith(handleNavigation(req));
    return;
  }

  // Range requests (PDFs, media) are never cached.
  if (req.headers.has('range')) return;

  // API, auth and dev-server paths are never cached.
  if (NEVER_CACHE_PREFIXES.some((p) => url.pathname.startsWith(p))) return;

  // Only known static asset types and the verified public files are handled.
  const cacheable =
    CACHEABLE_DESTINATIONS.has(req.destination) || STATIC_FILES.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(handleAsset(req));
});

