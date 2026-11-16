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

/** All Reader state + actions. Progress is saved automatically (debounced, flushed on exit). */
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

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    if (pending.current) {
      void readingProgressService.save(pending.current).catch(() => undefined);
      pending.current = null;
    }
  }, []);

  const load = useCallback(async () => {
    startRef.current = startPage;
    setError("");
    setStatus("loading");

    try {
      const loaded = await getReaderDocument(materialId);

      const [b, n, h, progress] = await Promise.all([
        bookmarksService.list(materialId).catch(() => []),
        notesService.list(materialId).catch(() => []),
        highlightsService.list(materialId).catch(() => []),
        readingProgressService.get(materialId).catch(() => null),
      ]);

      setDoc(loaded.doc);
      setSource(loaded.source);
      setBookmarks(b);
      setNotes(n);
      setHighlights(h);

      setPage(
        clamp(
          startRef.current ?? progress?.page ?? 1,
          1,
          loaded.doc.pages.length,
        ),
      );

      setStatus("ready");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This material could not be opened.",
      );
      setStatus("error");
    }
  }, [materialId, startPage]);

  useEffect(() => {
    void load();

    return flush;
  }, [load, flush]);

  const goTo = useCallback(
    (next: number) => {
      if (!doc) return;

      const p = clamp(Math.round(next) || 1, 1, doc.pages.length);

      setPage(p);

      pending.current = {
        materialId,
        page: p,
        totalPages: doc.pages.length,
        percent: Math.round((p / doc.pages.length) * 100),
        completed: p === doc.pages.length,
        updatedAt: new Date().toISOString(),
      };

      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }

      timer.current = window.setTimeout(flush, 700);
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
    } catch {
      return fail("We couldn’t update your bookmark. Please try again.");
    }
  }, [bookmarks, page, materialId, title]);

  const removeBookmark = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await bookmarksService.remove(id);

        setBookmarks((all) => all.filter((b) => b.id !== id));

        return ok("Bookmark removed.");
      } catch {
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
          const updated = {
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
      } catch {
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
    } catch {
      return fail("We couldn’t delete that note.");
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
      } catch {
        return fail("We couldn’t save that highlight.");
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
      } catch {
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
