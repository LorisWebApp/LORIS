/**
 * Browsers block plain-http requests from an https page ("mixed content").
 * Upgrade http:// to https:// when the app itself is served over https,
 * except for local development hosts.
 */
export function toHttps(url: string): string {
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return url;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url)) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

/** Path (and query) of a server-issued URL, so it can be re-based on the configured API origin. */
export function pathOf(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}
