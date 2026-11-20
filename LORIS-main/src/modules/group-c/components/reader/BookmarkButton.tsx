import { Bookmark } from "lucide-react";
import { Button } from "../user/sharedUi";

export interface BookmarkButtonProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** Adds or removes a bookmark for the page being read. */
export function BookmarkButton({
  active,
  onToggle,
  disabled = false,
}: BookmarkButtonProps) {
  return (
    <Button
      type="button"
      variant="icon"
      tone="inverse"
      filled={active}
      aria-label={
        active ? "Remove bookmark from this page" : "Bookmark this page"
      }
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
    >
      <Bookmark
        size={18}
        fill={active ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </Button>
  );
}
