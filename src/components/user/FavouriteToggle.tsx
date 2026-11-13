import { Bookmark } from "lucide-react";
import { cx } from "./sharedUi";

export interface FavouriteToggleProps {
  active: boolean;
  materialTitle: string;
  onToggle: () => void;
  /** Smaller button for compact (mobile) covers. */
  compact?: boolean;
}

/**
 * Round button drawn over a cover (the bookmark glyph in the wireframes).
 * DECISION TO CONFIRM: this toggles the material's *favourite* state (table user_favourites),
 * not a page bookmark – page bookmarks are created inside the reader.
 */
export function FavouriteToggle({
  active,
  materialTitle,
  onToggle,
  compact,
}: FavouriteToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${materialTitle} from favourites`
          : `Add ${materialTitle} to favourites`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={cx(
        "absolute grid place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        compact ? "right-1.5 top-1.5 size-6" : "right-3 top-3 size-8",
        active
          ? "bg-white text-ink"
          : "bg-black/25 text-white hover:bg-black/40",
      )}
    >
      <Bookmark
        size={compact ? 12 : 15}
        fill={active ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
