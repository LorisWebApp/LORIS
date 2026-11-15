import type { Bookmark } from "../types/reader.types";

import { createCrudService } from "./userCrud";

/**
 * Bookmarks service.
 *
 * Backend table: user_bookmarks
 * API endpoint: /api/bookmarks
 */
export const bookmarksService = createCrudService<Bookmark>({
  key: "bookmarks",
  path: "/bookmarks",
});
