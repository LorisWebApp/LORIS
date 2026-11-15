import { PenLine, X } from "lucide-react";
import type { HighlightColor } from "../../types/userLibrary.types";
import type { NewHighlight } from "../../hooks/useReader";
import { cx } from "../user/sharedUi";
import { HIGHLIGHT_COLORS, HIGHLIGHT_DOT } from "./highlightStyles";

export interface TextSelectionInfo extends NewHighlight {
  /** Viewport position of the selection. */
  x: number;
  y: number;
}

export interface HighlightToolProps {
  selection: TextSelectionInfo;
  onHighlight: (color: HighlightColor) => void;
  onAddNote: () => void;
  onDismiss: () => void;
}

/**
 * Floating toolbar for selected text.
 * Allows the reader to highlight text or attach a note.
 * Copying/exporting offline content is not supported.
 */
export function HighlightTool({
  selection,
  onHighlight,
  onAddNote,
  onDismiss,
}: HighlightToolProps) {
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1024;

  const left =
    viewportWidth < 300
      ? viewportWidth / 2
      : Math.min(Math.max(selection.x, 150), viewportWidth - 150);

  const top = Math.max(selection.y - 52, 8);

  return (
    <div
      role="toolbar"
      aria-label="Text selection tools"
      style={{ left, top }}
      onMouseDown={(event) => event.preventDefault()}
      className="fixed z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-deep px-2 py-1.5 text-white shadow-[0_8px_24px_rgba(5,32,30,0.35)]"
    >
      {HIGHLIGHT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Highlight ${color}`}
          title={`Highlight ${color}`}
          onClick={() => onHighlight(color)}
          className="grid size-7 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span
            aria-hidden="true"
            className={cx(
              "size-4 rounded-full ring-2 ring-white/30",
              HIGHLIGHT_DOT[color],
            )}
          />
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />

      <button
        type="button"
        onClick={onAddNote}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[14px] font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <PenLine size={14} aria-hidden="true" />
        Note
      </button>

      <button
        type="button"
        aria-label="Dismiss selection tools"
        title="Dismiss"
        onClick={onDismiss}
        className="grid size-7 place-items-center rounded-full text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
