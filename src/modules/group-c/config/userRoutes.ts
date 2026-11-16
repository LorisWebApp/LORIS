/**
 * Route paths used by Group C pages.
 *
 * Group C owns:
 * dashboard, my-library, reader, notes-bookmarks,
 * offline-library, profile, settings and support.
 *
 * Group B owns:
 * catalogue and material details.
 *
 * All Group C routes use the /user prefix.
 */

const USER_BASE = "/user";

export const USER_ROUTES = {
  dashboard: `${USER_BASE}/dashboard`,

  /** Group B page */
  catalogue: "/catalogue",

  /** Group B page */
  materialDetails: (materialId: string) =>
    `/materials/${encodeURIComponent(materialId)}`,

  /** Opens the reader, optionally jumping to a page. */
  reader: (materialId: string, page?: number) =>
    `${USER_BASE}/reader/${encodeURIComponent(materialId)}${page ? `?page=${page}` : ""}`,

  favourites: `${USER_BASE}/my-library`,
  notes: `${USER_BASE}/notes-bookmarks`,
  offline: `${USER_BASE}/offline-library`,
  profile: `${USER_BASE}/profile`,
  settings: `${USER_BASE}/settings`,
  support: `${USER_BASE}/support`,
} as const;
