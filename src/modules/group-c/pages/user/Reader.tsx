import { ArrowLeft, PanelLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { BookmarkButton } from "../../components/reader/BookmarkButton";
import {
  HighlightTool,
  type TextSelectionInfo,
} from "../../components/reader/HighlightTool";
import { NoteEditorModal } from "../../components/reader/NoteEditorModal";
import { NotesPanel } from "../../components/reader/NotesPanel";
import { PageText } from "../../components/reader/PageText";
import {
  FONT_SCALES,
  ReaderControls,
} from "../../components/reader/ReaderControls";
import { ReadingProgress } from "../../components/reader/ReadingProgress";
import {
  Alert,
  Button,
  LoadingIndicator,
  OfflineIndicator,
  ToastNotification,
} from "../../components/user/sharedUi";

import { USER_ROUTES } from "../../config/userRoutes";

import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { usePreferences } from "../../hooks/usePreferences";
import { useReader } from "../../hooks/useReader";

import { READER_THEMES } from "../../components/reader/readerTheme";

import type { ActionResult, Note } from "../../types/reader.types";
import type { HighlightColor } from "../../types/userLibrary.types";

type Toast = {
  variant: "success" | "error";
  message: string;
};

interface EditorTarget {
  page: number;
  quote?: string;
  note?: Note;
}

/**
 * Material reading interface.
 *
 * Group C – Reader screen.
 * Route: /user/reader/:id?page=N
 */
export function Reader() {
  const { id: materialId = "" } = useParams();
  const [params] = useSearchParams();

  const initialPage = Number(params.get("page")) || undefined;

  const reader = useReader(materialId, initialPage);

  const { doc, page, goTo } = reader;

  const online = useNetworkStatus();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { prefs } = usePreferences();

  const [panelOpen, setPanelOpen] = useState(false);

  const [fontScale, setFontScale] = useState<number>(
    FONT_SCALES[prefs.reading.fontSizeIndex] ?? 1,
  );

  const [selection, setSelection] = useState<TextSelectionInfo | null>(null);

  const [editor, setEditor] = useState<EditorTarget | null>(null);

  const [toast, setToast] = useState<Toast | null>(null);

  const scroller = useRef<HTMLElement>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Displays the result of a Reader action.
   */
  const report = useCallback((result: ActionResult) => {
    setToast({
      variant: result.ok ? "success" : "error",
      message: result.message,
    });
  }, []);

  /**
   * Keep the Reader font size synchronised with preferences.
   */
  useEffect(() => {
    setFontScale(FONT_SCALES[prefs.reading.fontSizeIndex] ?? 1);
  }, [prefs.reading.fontSizeIndex]);

  /**
   * Scroll to the top whenever the reader changes pages.
   */
  useEffect(() => {
    scroller.current?.scrollTo({
      top: 0,
      behavior: prefs.accessibility.reduceMotion ? "instant" : "smooth",
    });

    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [page, prefs.accessibility.reduceMotion]);

  /**
   * Keyboard navigation.
   * Arrow keys move between pages unless the user is typing
   * or editing a note.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (editor || !target) return;

      if (
        target.isContentEditable ||
        /INPUT|TEXTAREA|SELECT/.test(target.tagName)
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(page + 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(page - 1);
      }

      if (event.key === "Escape") {
        setPanelOpen(false);
        setSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goTo, page, editor]);

  /**
   * Saves the selected text as a highlight.
   */
  const applyHighlight = async (color: HighlightColor) => {
    if (!selection) return;

    const { x: _x, y: _y, ...highlight } = selection;

    const result = await reader.addHighlight(highlight, color);

    report(result);

    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  /**
   * Loading state.
   */
  if (reader.status === "loading") {
    return (
      <LoadingIndicator
        centered
        size="lg"
        label="Opening your material…"
        className="min-h-screen"
      />
    );
  }

  /**
   * Error state.
   */
  if (reader.status === "error" || !doc) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <Alert
          severity="error"
          title="We couldn’t open this material"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void reader.reload()}
              >
                Try again
              </Button>

              <Button size="sm" variant="text" to={USER_ROUTES.favourites}>
                Back to library
              </Button>
            </div>
          }
        >
          {reader.error}
        </Alert>
      </div>
    );
  }

  /**
   * Handle an empty document safely.
   */
  if (!doc.pages.length) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <Alert severity="error" title="No reading content available">
          This material does not currently contain any readable pages.
        </Alert>

        <Button to={USER_ROUTES.favourites} variant="outline" className="mt-4">
          Back to library
        </Button>
      </div>
    );
  }

  const current = doc.pages.find((item) => item.number === page);

  /**
   * Protect against an invalid page number.
   */
  if (!current) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <Alert severity="error" title="Page unavailable">
          The requested page could not be found.
        </Alert>

        <Button variant="outline" className="mt-4" onClick={() => goTo(1)}>
          Return to first page
        </Button>
      </div>
    );
  }

  const chapter = doc.chapters.find((item) => item.id === current.chapterId);

  const bookmarked = reader.bookmarks.some(
    (bookmark) => bookmark.page === page,
  );

  /**
   * Navigates from the contents/notes panel.
   */
  const goToFromPanel = (nextPage: number) => {
    goTo(nextPage);
    setPanelOpen(false);
  };

  /**
   * Shared NotesPanel used on desktop and mobile.
   */
  const panel = (extra?: { onClose: () => void; className: string }) => (
    <NotesPanel
      doc={doc}
      page={page}
      bookmarks={reader.bookmarks}
      notes={reader.notes}
      highlights={reader.highlights}
      onGoTo={goToFromPanel}
      onAddNote={() => {
        setPanelOpen(false);
        setEditor({ page });
      }}
      onEditNote={(note) => {
        setPanelOpen(false);

        setEditor({
          page: note.page,
          quote: note.quote,
          note,
        });
      }}
      onDeleteNote={async (id) => {
        report(await reader.removeNote(id));
      }}
      onDeleteBookmark={async (id) => {
        report(await reader.removeBookmark(id));
      }}
      onDeleteHighlight={async (id) => {
        report(await reader.removeHighlight(id));
      }}
      className={extra?.className ?? "w-[300px] shrink-0"}
      onClose={extra?.onClose}
    />
  );

  return (
    <div
      className={`flex h-screen flex-col ${
        READER_THEMES[prefs.reading.theme].surface
      }`}
    >
      <OfflineIndicator
        isOnline={online}
        variant="banner"
        description="Your reading progress, notes and highlights will sync when you reconnect."
      />

      {/* Reader header */}
      <header className="flex items-center gap-3 bg-deep px-4 py-2.5 text-white">
        <Button
          to={USER_ROUTES.favourites}
          variant="text"
          tone="inverse"
          size="sm"
          leftIcon={<ArrowLeft size={16} aria-hidden />}
        >
          Library
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate font-serif text-[20px] font-medium leading-tight">
            {doc.title}
          </h1>

          <p className="m-0 truncate text-[13px] text-white/65">
            {doc.author} · {doc.format} ·{" "}
            {reader.source === "offline" ? "Saved on this device" : "Online"}
          </p>
        </div>

        <ReadingProgress
          className="hidden w-56 sm:block"
          page={page}
          totalPages={doc.pages.length}
        />

        <BookmarkButton
          active={bookmarked}
          onToggle={async () => {
            report(await reader.toggleBookmark());
          }}
        />

        {!isDesktop && (
          <Button
            variant="icon"
            tone="inverse"
            aria-label="Open contents, bookmarks and notes"
            onClick={() => setPanelOpen(true)}
          >
            <PanelLeft size={18} aria-hidden />
          </Button>
        )}
      </header>

      {/* Reader content and desktop side panel */}
      <div className="flex min-h-0 flex-1">
        {isDesktop && panel()}

        <main
          ref={scroller}
          className="flex-1 overflow-y-auto px-3 pb-28 pt-8 sm:px-6"
        >
          <PageText
            page={current}
            chapterTitle={chapter?.title}
            highlights={reader.highlights.filter(
              (highlight) => highlight.page === page,
            )}
            fontScale={fontScale}
            prefs={prefs}
            onSelect={setSelection}
          />
        </main>
      </div>

      {/* Mobile side panel */}
      {!isDesktop && panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-deep/50"
          role="presentation"
          onMouseDown={() => setPanelOpen(false)}
        >
          <div
            className="h-full w-[88%] max-w-[360px]"
            role="dialog"
            aria-modal="true"
            aria-label="Contents, bookmarks and notes"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {panel({
              onClose: () => setPanelOpen(false),
              className: "w-full",
            })}
          </div>
        </div>
      )}

      {/* Bottom reading controls */}
      <ReaderControls
        page={page}
        totalPages={doc.pages.length}
        onPrev={() => goTo(page - 1)}
        onNext={() => goTo(page + 1)}
        onJump={goTo}
        fontScale={fontScale}
        onFontScale={setFontScale}
      />

      {/* Highlight selection toolbar */}
      {selection && (
        <HighlightTool
          selection={selection}
          onHighlight={(color) => void applyHighlight(color)}
          onAddNote={() => {
            setEditor({
              page: selection.page,
              quote: selection.text,
            });

            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
          onDismiss={() => {
            window.getSelection()?.removeAllRanges();
            setSelection(null);
          }}
        />
      )}

      {/* Add/edit note modal */}
      <NoteEditorModal
        open={editor !== null}
        title={
          editor?.note ? "Edit note" : `Add note · page ${editor?.page ?? page}`
        }
        quote={editor?.quote}
        initialText={editor?.note?.text}
        onClose={() => setEditor(null)}
        onSave={async (text) => {
          if (!editor) return;

          const result = await reader.saveNote(text, {
            page: editor.page,
            quote: editor.quote,
            existing: editor.note,
          });

          report(result);

          if (result.ok) {
            setEditor(null);
          }
        }}
      />

      {/* Action feedback */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Reader;
