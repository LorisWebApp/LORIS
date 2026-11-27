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

  const timer = useRef<number | null>(null);
  const pending = useRef<SavedProgress | null>(null);

  // Prevents older requests from updating a newer Reader session.
  const requestId = useRef(0);

  // Prevents delayed progress restoration from overriding user navigation.
  const userNavigated = useRef(false);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    if (!pending.current) return;

    const progressToSave = pending.current;
    pending.current = null;

    void readingProgressService
      .save(progressToSave)
      .then(() => {
        console.log("Reading progress saved successfully.");
      })
      .catch((saveError: unknown) => {
        console.error("Failed to save reading progress:", saveError);

        if (!pending.current) {
          pending.current = progressToSave;
        }
      });
  }, []);

  /**
   * Loads the document first.
   * Supporting user data is loaded independently in the background.
   */
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;

    userNavigated.current = false;

    setError("");
    setStatus("loading");

    setBookmarks([]);
    setNotes([]);
    setHighlights([]);

    try {
      if (!materialId.trim()) {
        throw new Error("A valid material ID is required.");
      }

      // First priority: load the actual reading document.
      const loaded = await getReaderDocument(materialId);

      if (currentRequest !== requestId.current) return;

      if (!loaded.doc.pages.length) {
        throw new Error("This material does not contain any readable pages.");
      }

      // Display the document immediately without waiting for supporting data.
      setDoc(loaded.doc);
      setSource(loaded.source);

      const initialPage = clamp(startPage ?? 1, 1, loaded.doc.pages.length);

      setPage(initialPage);
      setStatus("ready");

      console.log("Reader document opened:", {
        materialId,
        title: loaded.doc.title,
        totalPages: loaded.doc.pages.length,
        source: loaded.source,
      });

      // Load bookmarks independently in the background.
      void bookmarksService
        .list(materialId)
        .then((savedBookmarks) => {
          if (currentRequest === requestId.current) {
            setBookmarks(savedBookmarks);
          }
        })
        .catch((e) => {
          console.error("Could not load bookmarks:", e);
        });

      // Load notes independently in the background.
      void notesService
        .list(materialId)
        .then((savedNotes) => {
          if (currentRequest === requestId.current) {
            setNotes(savedNotes);
          }
        })
        .catch((e) => {
          console.error("Could not load notes:", e);
        });

      // Load highlights independently in the background.
      void highlightsService
        .list(materialId)
        .then((savedHighlights) => {
          if (currentRequest === requestId.current) {
            setHighlights(savedHighlights);
          }
        })
        .catch((e) => {
          console.error("Could not load highlights:", e);
        });

      // Restore reading progress in the background.
      void readingProgressService
        .get(materialId)
        .then((progress) => {
          if (
            currentRequest !== requestId.current ||
            !progress ||
            startPage !== undefined ||
            userNavigated.current
          ) {
            return;
          }

          const restoredPage = clamp(progress.page, 1, loaded.doc.pages.length);

          setPage(restoredPage);

          console.log("Previous reading progress restored:", restoredPage);
        })
        .catch((e) => {
          console.error("Could not load reading progress:", e);
        });
    } catch (e) {
      if (currentRequest !== requestId.current) return;

      console.error("Reader loading failed:", e);

      setError(
        e instanceof Error ? e.message : "This material could not be opened.",
      );

      setStatus("error");
    }
  }, [materialId, startPage]);

  useEffect(() => {
    void load();

    return () => {
      // Invalidate background requests when leaving or changing materials.
      requestId.current += 1;

      flush();
    };
  }, [load, flush]);

  /**
   * Changes the current page and schedules progress saving.
   */
  const goTo = useCallback(
    (next: number) => {
      if (!doc) {
        console.warn("Cannot change page because the document is not loaded.");
        return;
      }

      userNavigated.current = true;

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

      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }

      timer.current = window.setTimeout(() => {
        flush();
      }, 700);
    },
    [doc, materialId, flush],
  );

  const title = doc?.title ?? "";

  const now = () => new Date().toISOString();

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
