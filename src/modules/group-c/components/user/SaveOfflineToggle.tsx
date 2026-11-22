import { ArrowDownToLine, CircleCheck, LoaderCircle } from "lucide-react";

import { cx } from "./sharedUi";
import { useOfflineActions } from "./OfflineActionsContext";
import type { LibraryMaterial } from "../../types/userLibrary.types";
import type { ActionResult } from "../../types/reader.types";

export interface SaveOfflineToggleProps {
  material: LibraryMaterial;
  /** `cover` floats over a card cover; `reader` sits in the dark reader header. */
  placement?: "cover" | "reader";
  compact?: boolean;
  onResult?: (result: ActionResult) => void;
}

/** Saves a title to this device for offline reading (separate from favourite and bookmark). */
export function SaveOfflineToggle({ material, placement = "cover", compact = false, onResult }: SaveOfflineToggleProps) {
  const offline = useOfflineActions();
  if (!offline) return null;

  const saved = offline.savedIds.has(material.id);
  const busy = offline.downloadingIds.has(material.id);
  const label = busy
    ? "Saving for offline…"
    : saved
      ? "Remove from this device"
      : "Save for offline reading";

  const handle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    onResult?.(await offline.toggle(material));
  };

  const size = placement === "cover" ? (compact ? 12 : 15) : 18;
  const Icon = busy ? LoaderCircle : saved ? CircleCheck : ArrowDownToLine;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-busy={busy}
      aria-label={`${label}: ${material.title}`}
      title={label}
      onClick={handle}
      className={cx(
        "grid place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        placement === "cover" &&
          cx("absolute", compact ? "right-1.5 top-9 size-6" : "right-3 top-14 size-8"),
        placement === "reader" && "size-9 text-white hover:bg-white/15",
        placement === "cover" && (saved ? "bg-white text-ink" : "bg-black/25 text-white hover:bg-black/40"),
        placement === "reader" && saved && "bg-white/20",
      )}
    >
      <Icon size={size} className={busy ? "animate-spin" : undefined} aria-hidden="true" />
    </button>
  );
}
