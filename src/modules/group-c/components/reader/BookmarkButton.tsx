import { Bookmark } from "lucide-react";
import { Button } from "../user/sharedUi";

export interface BookmarkButtonProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** Adds or removes a bookmark for the current reading page. */
export function BookmarkButton({
  active,
  onToggle,
  disabled = false,
}: BookmarkButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      tone="inverse"
      size="sm"
      disabled={disabled}
      aria-label={
        active ? "Remove bookmark from this page" : "Bookmark this page"
      }
      aria-pressed={active}
      onClick={onToggle}
      leftIcon={
        <Bookmark
          size={17}
          fill={active ? "currentColor" : "none"}
          aria-hidden="true"
        />
      }
    >
      {active ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
