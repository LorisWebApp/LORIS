import { useCallback, useEffect, useState } from "react";
import { bookmarksService } from "../services/bookmarks.service";
import { highlightsService, notesService } from "../services/notes.service";
import type {
  ActionResult,
  Bookmark,
  Highlight,
  Note,
} from "../types/reader.types";

/** Every bookmark, note and highlight belonging to the user. */
export function useAnnotations() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const load = useCallback(async () => {
    setState("loading");

    try {
      const [bookmarkItems, noteItems, highlightItems] = await Promise.all([
        bookmarksService.list(),
        notesService.list(),
        highlightsService.list(),
      ]);

      const newestFirst = <T extends { createdAt: string }>(
        first: T,
        second: T,
      ) => second.createdAt.localeCompare(first.createdAt);

      setBookmarks([...bookmarkItems].sort(newestFirst));
      setNotes([...noteItems].sort(newestFirst));
      setHighlights([...highlightItems].sort(newestFirst));

      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const attempt = useCallback(
    async (
      action: () => Promise<void>,
      successMessage: string,
    ): Promise<ActionResult> => {
      try {
        await action();

        return {
          ok: true,
          message: successMessage,
        };
      } catch {
        return {
          ok: false,
          message: "That didn’t work. Please try again.",
        };
      }
    },
    [],
  );

  const removeBookmark = useCallback(
    (id: string): Promise<ActionResult> =>
      attempt(async () => {
        await bookmarksService.remove(id);
        setBookmarks((current) =>
          current.filter((bookmark) => bookmark.id !== id),
        );
      }, "Bookmark removed."),
    [attempt],
  );

  const removeHighlight = useCallback(
    (id: string): Promise<ActionResult> =>
      attempt(async () => {
        await highlightsService.remove(id);
        setHighlights((current) =>
          current.filter((highlight) => highlight.id !== id),
        );
      }, "Highlight removed."),
    [attempt],
  );

  const removeNote = useCallback(
    (id: string): Promise<ActionResult> =>
      attempt(async () => {
        await notesService.remove(id);
        setNotes((current) => current.filter((note) => note.id !== id));
      }, "Note deleted."),
    [attempt],
  );

  const editNote = useCallback(
    (note: Note, text: string): Promise<ActionResult> =>
      attempt(async () => {
        const updated: Note = {
          ...note,
          text,
          updatedAt: new Date().toISOString(),
        };

        await notesService.update(updated);

        setNotes((current) =>
          current.map((item) => (item.id === note.id ? updated : item)),
        );
      }, "Note updated."),
    [attempt],
  );

  return {
    state,
    bookmarks,
    notes,
    highlights,
    reload: load,
    removeBookmark,
    removeHighlight,
    removeNote,
    editNote,
  };
}
