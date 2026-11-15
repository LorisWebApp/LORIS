import type { Highlight, Note } from "../types/reader.types";

import { createCrudService } from "./userCrud";

/**
 * Personal notes service.
 *
 * Backend table: user_notes
 * API endpoint: /api/notes
 */
export const notesService = createCrudService<Note>({
  key: "notes",
  path: "/notes",
});

/**
 * Highlight service.
 *
 * Backend table: user_highlights
 * API endpoint: /api/highlights
 */
export const highlightsService = createCrudService<Highlight>({
  key: "highlights",
  path: "/highlights",
});
