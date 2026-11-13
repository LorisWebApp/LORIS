/**
 * Route paths used by the Group C pages.
 * ASSUMPTION: adjust these to match the team's real router. Every Group C link reads from here,
 * so this is the only file to change if the paths differ.
 */
export const USER_ROUTES = {
  dashboard: "/user/dashboard",
  /** Group B page */
  catalogue: "/user/catalogue",
  /** Group B page */
  materialDetails: (materialId: string) =>
    `/user/materials/${encodeURIComponent(materialId)}`,
  /** Opens the reader; an optional page jumps straight to a bookmark, note or highlight. */
  reader: (materialId: string, page?: number) =>
    `/user/reader/${encodeURIComponent(materialId)}${page !== undefined ? `?page=${page}` : ""}`,
  favourites: "/user/favourites",
  notes: "/user/notes",
  offline: "/user/offline",
  profile: "/user/profile",
} as const;
