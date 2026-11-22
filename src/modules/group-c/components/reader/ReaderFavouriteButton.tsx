import { Heart } from "lucide-react";
import { Button } from "../user/sharedUi";

export interface ReaderFavouriteButtonProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** Adds or removes the whole title from favourites (not a page bookmark). */
export function ReaderFavouriteButton({ active, onToggle, disabled = false }: ReaderFavouriteButtonProps) {
  return (
    <Button
      type="button"
      variant="icon"
      tone="inverse"
      filled={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
    >
      <Heart size={18} fill={active ? "currentColor" : "none"} aria-hidden="true" />
    </Button>
  );
}
