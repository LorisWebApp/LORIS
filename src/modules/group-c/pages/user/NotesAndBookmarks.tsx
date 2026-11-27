import { Pencil, Search, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { HIGHLIGHT_DOT } from "../../components/reader/highlightStyles";
import { NoteEditorModal } from "../../components/reader/NoteEditorModal";

import {
  Alert,
  Button,
  ConfirmationDialog,
  DataTable,
  EmptyState,
  LoadingIndicator,
  PageHeader,
  TabNavigation,
  ToastNotification,
  cx,
  type DataTableColumn,
} from "../../components/user/sharedUi";

import { USER_ROUTES } from "../../config/userRoutes";
import { useAnnotations } from "../../hooks/useAnnotations";

import type { Bookmark, Highlight, Note } from "../../types/reader.types";

import { formatTimeAgo } from "../../utils/libraryFormat";

type Tab = "bookmarks" | "notes" | "highlights";

type Pending = {
  kind: Tab;
  id: string;
  label: string;
};

interface Row {
  id: string;
  materialId: string;
  materialTitle: string;
  page: number;
  createdAt: string;
}

interface SearchResult {
  id: string;
  kind: "Bookmark" | "Note" | "Highlight";
  materialId: string;
  materialTitle: string;
  page: number;
  content: string;
  createdAt: string;
}

/**
 * Notes, bookmarks and highlights across every material.
 *
 * Group C – Screen 4.
 * Route: /user/notes
 */
export function NotesAndBookmarks() {
  const annotations = useAnnotations();

  const [tab, setTab] = useState<Tab>("bookmarks");
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [removing, setRemoving] = useState(false);

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Searches all three annotation categories.
   * Results are filtered by the currently selected tab.
   */
  const searchResults = useMemo<SearchResult[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return [];

    const matchingBookmarks = annotations.bookmarks
      .filter((bookmark) => {
        const searchableText = [bookmark.label ?? "", bookmark.materialTitle]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(term);
      })
      .map(
        (bookmark): SearchResult => ({
          id: bookmark.id,
          kind: "Bookmark",
          materialId: bookmark.materialId,
          materialTitle: bookmark.materialTitle,
          page: bookmark.page,
          content: bookmark.label ?? "",
          createdAt: bookmark.createdAt,
        }),
      );

    const matchingNotes = annotations.notes
      .filter((note) => {
        const searchableText = [note.text, note.quote ?? "", note.materialTitle]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(term);
      })
      .map(
        (note): SearchResult => ({
          id: note.id,
          kind: "Note",
          materialId: note.materialId,
          materialTitle: note.materialTitle,
          page: note.page,
          content: note.text,
          createdAt: note.createdAt,
        }),
      );

    const matchingHighlights = annotations.highlights
      .filter((highlight) => {
        const searchableText = [highlight.text, highlight.materialTitle]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(term);
      })
      .map(
        (highlight): SearchResult => ({
          id: highlight.id,
          kind: "Highlight",
          materialId: highlight.materialId,
          materialTitle: highlight.materialTitle,
          page: highlight.page,
          content: highlight.text,
          createdAt: highlight.createdAt,
        }),
      );

    const allResults = [
      ...matchingBookmarks,
      ...matchingNotes,
      ...matchingHighlights,
    ];

    const selectedKind = {
      bookmarks: "Bookmark",
      notes: "Note",
      highlights: "Highlight",
    }[tab];

    return allResults
      .filter((result) => result.kind === selectedKind)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [
    searchTerm,
    tab,
    annotations.bookmarks,
    annotations.notes,
    annotations.highlights,
  ]);

  /**
   * Deletes the selected annotation after confirmation.
   */
  const confirmDelete = async () => {
    if (!pending || removing) return;

    setRemoving(true);

    try {
      let result;

      switch (pending.kind) {
        case "bookmarks":
          result = await annotations.removeBookmark(pending.id);
          break;

        case "notes":
          result = await annotations.removeNote(pending.id);
          break;

        case "highlights":
          result = await annotations.removeHighlight(pending.id);
          break;
      }

      setToast({
        variant: result.ok ? "success" : "error",
        message: result.message,
      });

      if (result.ok) {
        setPending(null);
      }
    } catch {
      setToast({
        variant: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setRemoving(false);
    }
  };

  /**
   * Builds reusable table columns for each annotation type.
   */
  const base = <T extends Row>(
    kind: Tab,
    label: (row: T) => React.ReactNode,
    extra?: (row: T) => React.ReactNode,
  ): DataTableColumn<T>[] => [
    {
      key: "material",
      header: "Material",
      cell: (row) => <span className="font-semibold">{row.materialTitle}</span>,
    },
    {
      key: "page",
      header: "Page",
      width: "w-20",
      cell: (row) => row.page,
    },
    ...(kind === "bookmarks"
      ? []
      : [
          {
            key: "content",
            header: kind === "notes" ? "Note" : "Highlight",
            cell: (row: T) => label(row),
          } as DataTableColumn<T>,
        ]),
    {
      key: "when",
      header: "Saved",
      width: "w-28",
      cell: (row) => (
        <span className="text-muted">{formatTimeAgo(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "w-40",
      cell: (row) => (
        <span className="inline-flex items-center gap-1">
          <Button
            to={USER_ROUTES.reader(row.materialId, row.page)}
            variant="text"
            size="sm"
          >
            Open
          </Button>

          {extra?.(row)}

          <Button
            variant="icon"
            size="sm"
            aria-label={`Delete ${kind.slice(0, -1)} on page ${row.page} of ${row.materialTitle}`}
            onClick={() =>
              setPending({
                kind,
                id: row.id,
                label: row.materialTitle,
              })
            }
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        </span>
      ),
    },
  ];

  /**
   * Shared empty state for all annotation tables.
   */
  const empty = (title: string, description: string) => (
    <EmptyState
      title={title}
      description={description}
      action={
        <Button to={USER_ROUTES.favourites} variant="outline">
          Open my library
        </Button>
      }
    />
  );

  const searchCategory = {
    bookmarks: "bookmarks",
    notes: "notes",
    highlights: "highlights",
  }[tab];

  return (
    <div className="min-h-screen">
      {/* Page heading */}
      <PageHeader
        tone="dark"
        size="md"
        className="px-4 py-10 lg:px-10"
        eyebrow="— Your marginalia"
        title="Notes & Bookmarks"
        description="Every bookmark, note and highlight you’ve made. Open one to jump straight back to the page."
      />

      <div className="mx-auto w-full max-w-[1312px] px-4 py-8 lg:px-10">
        {/* Search */}
        <div className="mb-6">
          <label
            htmlFor="annotation-search"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Search your notes, bookmarks and highlights
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm focus-within:border-ink">
            <Search size={19} className="shrink-0 text-muted" aria-hidden />

            <input
              id="annotation-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by keyword, phrase or material title..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              aria-describedby="annotation-search-help"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="rounded-md p-1 text-muted transition hover:bg-paper hover:text-ink"
                aria-label="Clear search"
              >
                <X size={17} aria-hidden />
              </button>
            )}
          </div>

          <p id="annotation-search-help" className="mt-2 text-xs text-muted">
            Search across your saved bookmarks, notes and highlights. Select a
            category below to filter the results.
          </p>
        </div>

        {/* Annotation tabs */}
        <TabNavigation
          aria-label="Annotation types"
          activeId={tab}
          onChange={(id) => {
            if (id === "bookmarks" || id === "notes" || id === "highlights") {
              setTab(id);
            }
          }}
          tabs={[
            {
              id: "bookmarks",
              label: "Bookmarks",
              count: annotations.bookmarks.length,
            },
            {
              id: "notes",
              label: "Notes",
              count: annotations.notes.length,
            },
            {
              id: "highlights",
              label: "Highlights",
              count: annotations.highlights.length,
            },
          ]}
        />

        <div className="mt-6">
          {annotations.state === "loading" && (
            <LoadingIndicator centered label="Loading…" />
          )}

          {annotations.state === "error" && (
            <Alert
              severity="error"
              title="We couldn’t load your annotations"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void annotations.reload()}
                >
                  Try again
                </Button>
              }
            >
              Check your connection and try again.
            </Alert>
          )}

          {/* Filtered search results */}
          {annotations.state === "ready" && searchTerm.trim() !== "" && (
            <section aria-live="polite">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink">
                  {tab === "bookmarks" && "Bookmark search results"}
                  {tab === "notes" && "Note search results"}
                  {tab === "highlights" && "Highlight search results"}
                </h2>

                <span className="text-sm text-muted">
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "result" : "results"}
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="rounded-xl border border-border bg-white px-6 py-10 text-center">
                  <Search
                    size={28}
                    className="mx-auto mb-3 text-muted"
                    aria-hidden
                  />

                  <h3 className="font-semibold text-ink">
                    No matching {searchCategory}
                  </h3>

                  <p className="mt-2 text-sm text-muted">
                    Try another keyword or phrase, or select another category.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <article
                      key={`${result.kind}-${result.id}`}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cx(
                                "rounded-full px-2.5 py-1 text-xs font-semibold",
                                result.kind === "Note"
                                  ? "bg-amber-100 text-amber-800"
                                  : result.kind === "Bookmark"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800",
                              )}
                            >
                              {result.kind}
                            </span>

                            <span className="text-xs text-muted">
                              Page {result.page}
                            </span>
                          </div>

                          <h3 className="font-semibold text-ink">
                            {result.materialTitle}
                          </h3>

                          {result.content && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                              {result.kind === "Highlight"
                                ? `“${result.content}”`
                                : result.content}
                            </p>
                          )}

                          <p className="mt-3 text-xs text-muted">
                            Saved {formatTimeAgo(result.createdAt)}
                          </p>
                        </div>

                        <Button
                          to={USER_ROUTES.reader(
                            result.materialId,
                            result.page,
                          )}
                          variant="outline"
                          size="sm"
                        >
                          Open page
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Normal annotation tables when search is empty */}
          {annotations.state === "ready" && searchTerm.trim() === "" && (
            <>
              {/* Bookmarks */}
              {tab === "bookmarks" && (
                <DataTable<Bookmark>
                  caption="Bookmarks"
                  rows={annotations.bookmarks}
                  getRowKey={(row) => row.id}
                  columns={base<Bookmark>("bookmarks", () => "")}
                  emptyState={empty(
                    "No bookmarks yet",
                    "Use the bookmark button in the reader to mark a page.",
                  )}
                />
              )}

              {/* Notes */}
              {tab === "notes" && (
                <DataTable<Note>
                  caption="Notes"
                  rows={annotations.notes}
                  getRowKey={(row) => row.id}
                  columns={base<Note>(
                    "notes",
                    (note) => (
                      <span>
                        {note.quote && (
                          <em className="mb-1 block font-serif text-ink/75">
                            “{note.quote}”
                          </em>
                        )}

                        {note.text}
                      </span>
                    ),
                    (note) => (
                      <Button
                        variant="icon"
                        size="sm"
                        aria-label={`Edit note on page ${note.page} of ${note.materialTitle}`}
                        onClick={() => setEditing(note)}
                      >
                        <Pencil size={14} aria-hidden />
                      </Button>
                    ),
                  )}
                  emptyState={empty(
                    "No notes yet",
                    "Select text in the reader and choose Note.",
                  )}
                />
              )}

              {/* Highlights */}
              {tab === "highlights" && (
                <DataTable<Highlight>
                  caption="Highlights"
                  rows={annotations.highlights}
                  getRowKey={(row) => row.id}
                  columns={base<Highlight>("highlights", (highlight) => (
                    <span className="flex items-start gap-2">
                      <span
                        className={cx(
                          "mt-2 size-2 shrink-0 rounded-full",
                          HIGHLIGHT_DOT[highlight.color],
                        )}
                        aria-hidden
                      />

                      <em className="font-serif">“{highlight.text}”</em>
                    </span>
                  ))}
                  emptyState={empty(
                    "No highlights yet",
                    "Select text in the reader and pick a colour.",
                  )}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit note modal */}
      <NoteEditorModal
        open={editing !== null}
        title="Edit note"
        quote={editing?.quote}
        initialText={editing?.text}
        onClose={() => setEditing(null)}
        onSave={async (text) => {
          if (!editing) return;

          const result = await annotations.editNote(editing, text);

          setToast({
            variant: result.ok ? "success" : "error",
            message: result.message,
          });

          if (result.ok) {
            setEditing(null);
          }
        }}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={pending !== null}
        title={`Delete this ${pending?.kind.slice(0, -1) ?? "item"}?`}
        description={
          pending
            ? `It will be removed from “${pending.label}”. This can’t be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={removing}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!removing) {
            setPending(null);
          }
        }}
      />

      {/* Feedback */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default NotesAndBookmarks;
