import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import type {
  Bookmark,
  Highlight,
  Note,
  ReaderDocument,
} from "../../types/reader.types";

import { Button, EmptyState, TabNavigation, cx } from "../user/sharedUi";
import { HIGHLIGHT_DOT } from "./highlightStyles";

export interface NotesPanelProps {
  doc: ReaderDocument;
  page: number;
  bookmarks: Bookmark[];
  notes: Note[];
  highlights: Highlight[];
  onGoTo: (page: number) => void;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onDeleteHighlight: (id: string) => void;
  /** Mobile: panel is a slide-over that can be closed. */
  onClose?: () => void;
  className?: string;
}

type Tab = "contents" | "bookmarks" | "notes";

const rowButton =
  "block w-full px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand";

/** Side panel: contents, bookmarks, notes and highlights. */
export function NotesPanel({
  doc,
  page,
  bookmarks,
  notes,
  highlights,
  onGoTo,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onDeleteBookmark,
  onDeleteHighlight,
  onClose,
  className,
}: NotesPanelProps) {
  const [tab, setTab] = useState<Tab>("contents");

  const currentChapter = doc.pages[page - 1]?.chapterId;
  const annotationCount = notes.length + highlights.length;

  const sortedBookmarks = [...bookmarks].sort((a, b) => a.page - b.page);

  return (
    <aside
      aria-label="Reader side panel"
      className={cx(
        "flex h-full flex-col border-r border-line bg-[#f6f3ea]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <TabNavigation
          aria-label="Side panel sections"
          activeId={tab}
          onChange={(id) => {
            if (id === "contents" || id === "bookmarks" || id === "notes") {
              setTab(id);
            }
          }}
          tabs={[
            { id: "contents", label: "Contents" },
            {
              id: "bookmarks",
              label: "Bookmarks",
              count: bookmarks.length,
            },
            {
              id: "notes",
              label: "Notes",
              count: annotationCount,
            },
          ]}
        />

        {onClose && (
          <Button
            type="button"
            variant="icon"
            size="sm"
            aria-label="Close side panel"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="mt-2 flex-1 overflow-y-auto pb-24">
        {/* Table of contents */}
        {tab === "contents" &&
          (doc.chapters.length === 0 ? (
            <EmptyState
              className="py-10"
              title="No contents available"
              description="This material does not have chapter information."
            />
          ) : (
            <ul className="m-0 list-none p-0">
              {doc.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => onGoTo(chapter.page)}
                    aria-current={
                      chapter.id === currentChapter ? "true" : undefined
                    }
                    className={cx(
                      rowButton,
                      chapter.id === currentChapter
                        ? "bg-mint font-semibold text-deep"
                        : "text-ink/80",
                    )}
                  >
                    {chapter.title}
                    <span className="float-right text-muted">
                      {chapter.page}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {/* Bookmarks */}
        {tab === "bookmarks" &&
          (sortedBookmarks.length === 0 ? (
            <EmptyState
              className="py-10"
              title="No bookmarks yet"
              description="Use the bookmark button in the top bar to mark a page."
            />
          ) : (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {sortedBookmarks.map((bookmark) => (
                <li key={bookmark.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onGoTo(bookmark.page)}
                    className={cx(rowButton, "flex-1 text-deep")}
                  >
                    {bookmark.label}
                    <span className="ml-2 text-muted">p. {bookmark.page}</span>
                  </button>

                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    aria-label={`Remove bookmark on page ${bookmark.page}`}
                    onClick={() => onDeleteBookmark(bookmark.id)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ))}

        {/* Notes and highlights */}
        {tab === "notes" && (
          <div>
            <div className="px-4 pb-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus size={14} aria-hidden="true" />}
                onClick={onAddNote}
              >
                Add note for page {page}
              </Button>
            </div>

            {annotationCount === 0 ? (
              <EmptyState
                className="py-8"
                title="No notes or highlights"
                description="Select text on the page to highlight it or attach a note."
              />
            ) : (
              <ul className="m-0 list-none divide-y divide-line p-0">
                {highlights.map((highlight) => (
                  <li
                    key={highlight.id}
                    className="flex items-start gap-1 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => onGoTo(highlight.page)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-center gap-2 text-[13px] text-muted">
                        <span
                          className={cx(
                            "size-2 rounded-full",
                            HIGHLIGHT_DOT[highlight.color],
                          )}
                          aria-hidden="true"
                        />
                        Highlight · p. {highlight.page}
                      </span>

                      <span className="mt-1 block font-serif text-[16px] italic text-ink">
                        “{highlight.text}”
                      </span>
                    </button>

                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      aria-label={`Remove highlight on page ${highlight.page}`}
                      onClick={() => onDeleteHighlight(highlight.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </li>
                ))}

                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start gap-1 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => onGoTo(note.page)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="text-[13px] text-muted">
                        Note · p. {note.page}
                      </span>

                      {note.quote && (
                        <span className="mt-1 block font-serif text-[15px] italic text-ink/80">
                          “{note.quote}”
                        </span>
                      )}

                      <span className="mt-1 block text-[15px] text-deep">
                        {note.text}
                      </span>
                    </button>

                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      aria-label={`Edit note on page ${note.page}`}
                      onClick={() => onEditNote(note)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Button>

                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      aria-label={`Delete note on page ${note.page}`}
                      onClick={() => onDeleteNote(note.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
