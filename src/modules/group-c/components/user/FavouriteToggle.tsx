import { Heart } from "lucide-react";

import { cx } from "./sharedUi";

export interface FavouriteToggleProps {
  active: boolean;
  materialTitle: string;
  onToggle: () => void;

  /** Smaller button for compact mobile covers. */
  compact?: boolean;
}

/**
 * Favourite button displayed over a material cover.
 *
 * This toggles the material's favourite state.
 * Saving offline and page bookmarks are separate buttons.
 */
export function FavouriteToggle({
  active,
  materialTitle,
  onToggle,
  compact = false,
}: FavouriteToggleProps) {
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${materialTitle} from favourites`
          : `Add ${materialTitle} to favourites`
      }
      title={active ? "Remove from favourites" : "Add to favourites"}
      onClick={handleToggle}
      className={cx(
        "absolute grid place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        compact ? "right-1.5 top-1.5 size-6" : "right-3 top-3 size-8",
        active
          ? "bg-white text-ink"
          : "bg-black/25 text-white hover:bg-black/40",
      )}
    >
      <Heart
        size={compact ? 12 : 15}
        fill={active ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
