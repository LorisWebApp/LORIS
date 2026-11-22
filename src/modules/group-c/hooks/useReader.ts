import { useCallback, useEffect, useRef, useState } from "react";

import { bookmarksService } from "../services/bookmarks.service";
import { highlightsService, notesService } from "../services/notes.service";
import { getReaderDocument } from "../services/readerContent.service";
import { readingProgressService } from "../services/readingProgress.service";
import { newId } from "../services/userCrud";

import type {
  ActionResult,
  Bookmark,
  Highlight,
  Note,
  ReaderDocument,
  SavedProgress,
} from "../types/reader.types";

import type { HighlightColor } from "../types/userLibrary.types";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const ok = (message: string): ActionResult => ({
  ok: true,
  message,
});

const fail = (message: string): ActionResult => ({
  ok: false,
  message,
});

export interface NewHighlight {
  page: number;
  paragraph: number;
  start: number;
  end: number;
  text: string;
}

/**
 * Manages all Reader state and actions.
 *
 * Reading progress is:
 * - Prepared whenever the user changes pages.
 * - Saved automatically after a short delay.
 * - Flushed when the Reader is closed or the component unmounts.
 */
export function useReader(materialId: string, startPage?: number) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const [error, setError] = useState("");
  const [doc, setDoc] = useState<ReaderDocument | null>(null);
  const [source, setSource] = useState<"online" | "offline">("online");
  const [page, setPage] = useState(1);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const startRef = useRef(startPage);
  const timer = useRef<number | null>(null);
  const pending = useRef<SavedProgress | null>(null);

  /**
   * Saves pending reading progress.
   *
   * Errors are logged so we can identify problems with Supabase,
   * authentication, database permissions, or the save operation.
   */
  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    if (!pending.current) {
      return;
    }

    const progressToSave = pending.current;

    // Clear the pending value before starting the request.
    pending.current = null;

    console.log("Attempting to save reading progress:", progressToSave);

    void readingProgressService
      .save(progressToSave)
      .then(() => {
        console.log("Reading progress saved successfully.");
      })
      .catch((saveError: unknown) => {
        console.error("Failed to save reading progress:", saveError);

        // Restore the failed progress if no newer progress is waiting.
        if (!pending.current) {
          pending.current = progressToSave;
        }
      });
  }, []);

  /**
   * Loads the reader document and the user's saved information.
   */
  const load = useCallback(async () => {
    startRef.current = startPage;

    setError("");
    setStatus("loading");

    try {
      if (!materialId.trim()) {
        throw new Error("A valid material ID is required.");
      }

      const loaded = await getReaderDocument(materialId);

      if (!loaded.doc.pages.length) {
        throw new Error("This material does not contain any readable pages.");
      }

      const [savedBookmarks, savedNotes, savedHighlights, progress] =
        await Promise.all([
          bookmarksService.list(materialId).catch((e) => {
            console.error("Could not load bookmarks:", e);
            return [];
          }),

          notesService.list(materialId).catch((e) => {
            console.error("Could not load notes:", e);
            return [];
          }),

          highlightsService.list(materialId).catch((e) => {
            console.error("Could not load highlights:", e);
            return [];
          }),

          readingProgressService.get(materialId).catch((e) => {
            console.error("Could not load reading progress:", e);
            return null;
          }),
        ]);

      setDoc(loaded.doc);
      setSource(loaded.source);

      setBookmarks(savedBookmarks);
      setNotes(savedNotes);
      setHighlights(savedHighlights);

      const initialPage = startRef.current ?? progress?.page ?? 1;

      setPage(clamp(initialPage, 1, loaded.doc.pages.length));

      setStatus("ready");

      console.log("Reader loaded successfully:", {
        materialId,
        title: loaded.doc.title,
        totalPages: loaded.doc.pages.length,
        savedPage: progress?.page ?? null,
        source: loaded.source,
      });
    } catch (e) {
      console.error("Reader loading failed:", e);

      setError(
        e instanceof Error ? e.message : "This material could not be opened.",
      );

      setStatus("error");
    }
  }, [materialId, startPage]);

  /**
   * Load the document when the material changes.
   * Flush pending progress when leaving the Reader.
   */
  useEffect(() => {
    void load();

    return () => {
      flush();
    };
  }, [load, flush]);

  /**
   * Changes the current page and schedules progress saving.
   */
  const goTo = useCallback(
    (next: number) => {
      if (!doc) {
        console.warn(
          "Cannot change page because the Reader document is not loaded.",
        );
        return;
      }

      const nextPage = clamp(Math.round(next) || 1, 1, doc.pages.length);

      setPage(nextPage);

      const progress: SavedProgress = {
        materialId,
        page: nextPage,
        totalPages: doc.pages.length,
        percent: Math.round((nextPage / doc.pages.length) * 100),
        completed: nextPage === doc.pages.length,
        updatedAt: new Date().toISOString(),
      };

      pending.current = progress;

      console.log("Reading progress prepared:", progress);

      // Reset the previous timer.
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }

      // Save after the user has stopped changing pages for 700ms.
      timer.current = window.setTimeout(() => {
        flush();
      }, 700);
    },
    [doc, materialId, flush],
  );

  const title = doc?.title ?? "";

  const now = () => new Date().toISOString();

  /**
   * Adds or removes a bookmark on the current page.
   */
  const toggleBookmark = useCallback(async (): Promise<ActionResult> => {
    const existing = bookmarks.find((b) => b.page === page);

    try {
      if (existing) {
        await bookmarksService.remove(existing.id);

        setBookmarks((all) => all.filter((b) => b.id !== existing.id));

        return ok("Bookmark removed.");
      }

      const item: Bookmark = {
        id: newId(),
        materialId,
        materialTitle: title,
        page,
        label: `Page ${page}`,
        createdAt: now(),
      };

      await bookmarksService.create(item);

      setBookmarks((all) => [item, ...all]);

      return ok(`Page ${page} bookmarked.`);
    } catch (e) {
      console.error("Bookmark operation failed:", e);

      return fail("We couldn’t update your bookmark. Please try again.");
    }
  }, [bookmarks, page, materialId, title]);

  /**
   * Removes a bookmark.
   */
  const removeBookmark = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await bookmarksService.remove(id);

        setBookmarks((all) => all.filter((b) => b.id !== id));

        return ok("Bookmark removed.");
      } catch (e) {
        console.error("Removing bookmark failed:", e);

        return fail("We couldn’t remove that bookmark.");
      }
    },
    [],
  );

  /**
   * Creates a new note or updates an existing note.
   */
  const saveNote = useCallback(
    async (
      text: string,
      target: {
        page: number;
        quote?: string;
        existing?: Note;
      },
    ): Promise<ActionResult> => {
      try {
        if (target.existing) {
          const updated: Note = {
            ...target.existing,
            text,
            updatedAt: now(),
          };

          await notesService.update(updated);

          setNotes((all) =>
            all.map((n) => (n.id === updated.id ? updated : n)),
          );

          return ok("Note updated.");
        }

        const item: Note = {
          id: newId(),
          materialId,
          materialTitle: title,
          page: target.page,
          text,
          quote: target.quote,
          createdAt: now(),
          updatedAt: now(),
        };

        await notesService.create(item);

        setNotes((all) => [item, ...all]);

        return ok("Note saved.");
      } catch (e) {
        console.error("Saving note failed:", e);

        return fail("We couldn’t save your note. Please try again.");
      }
    },
    [materialId, title],
  );

  /**
   * Deletes a note.
   */
  const removeNote = useCallback(async (id: string): Promise<ActionResult> => {
    try {
      await notesService.remove(id);

      setNotes((all) => all.filter((n) => n.id !== id));

      return ok("Note deleted.");
    } catch (e) {
      console.error("Deleting note failed:", e);

      return fail("We couldn’t delete your note.");
    }
  }, []);

  /**
   * Creates a highlight.
   */
  const addHighlight = useCallback(
    async (h: NewHighlight, color: HighlightColor): Promise<ActionResult> => {
      try {
        const item: Highlight = {
          id: newId(),
          materialId,
          materialTitle: title,
          ...h,
          color,
          createdAt: now(),
        };

        await highlightsService.create(item);

        setHighlights((all) => [item, ...all]);

        return ok("Highlight saved.");
      } catch (e) {
        console.error("Saving highlight failed:", e);

        return fail("We couldn’t save that highlight. Please try again.");
      }
    },
    [materialId, title],
  );

  /**
   * Removes a highlight.
   */
  const removeHighlight = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await highlightsService.remove(id);

        setHighlights((all) => all.filter((h) => h.id !== id));

        return ok("Highlight removed.");
      } catch (e) {
        console.error("Removing highlight failed:", e);

        return fail("We couldn’t remove that highlight.");
      }
    },
    [],
  );

  return {
    status,
    error,
    doc,
    source,
    page,
    bookmarks,
    notes,
    highlights,

    reload: load,
    goTo,

    toggleBookmark,
    removeBookmark,

    saveNote,
    removeNote,

    addHighlight,
    removeHighlight,
  };
}
