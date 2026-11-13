import { CircleCheck } from "lucide-react";
import { USER_ROUTES } from "../../config/userRoutes";
import type {
  LibraryMaterial,
  ReadingProgressSummary,
} from "../../types/userLibrary.types";
import {
  materialDetails,
  openActionLabel,
  formatTimeAgo,
} from "../../utils/libraryFormat";
import { BookCover } from "./BookCover";
import { FavouriteToggle } from "./FavouriteToggle";
import { Button, ProgressIndicator, type MaterialListEntry } from "./sharedUi";

export interface EntryOptions {
  /** `card` = desktop grid card, `compact` = mobile stacked entry. */
  layout: "card" | "compact";
  variant: "shelf" | "recommendation";
  isFavourite: boolean;
  isOffline: boolean;
  onToggleFavourite: (materialId: string) => void;
  progress?: ReadingProgressSummary;
}

/** Maps a material (plus optional reading progress) to the shared <MaterialItem /> props. */
export function buildMaterialEntry(
  material: LibraryMaterial,
  options: EntryOptions,
): MaterialListEntry {
  const {
    layout,
    variant,
    isFavourite,
    isOffline,
    onToggleFavourite,
    progress,
  } = options;
  const compact = layout === "compact";
  const readerPath = USER_ROUTES.reader(material.id);
  const pagePosition =
    progress?.currentPage && progress.totalPages
      ? `p. ${progress.currentPage} / ${progress.totalPages}`
      : undefined;

  const status =
    variant === "recommendation" ? (
      <span className="inline-flex items-center gap-1 font-semibold text-brand">
        <CircleCheck size={14} aria-hidden /> Available to read
      </span>
    ) : isOffline ? (
      <span className="font-semibold text-brand">Offline ready</span>
    ) : (
      <span className="text-muted">Online only</span>
    );

  let actions;
  if (variant === "recommendation") {
    actions = (
      <Button
        to={USER_ROUTES.materialDetails(material.id)}
        variant="outline"
        size="sm"
      >
        View details
      </Button>
    );
  } else if (compact) {
    actions = (
      <>
        {progress && (
          // No label: the shared ProgressIndicator would print it. The % beside the title already names it.
          <ProgressIndicator
            className="min-w-0 flex-1 self-center"
            size="sm"
            value={progress.percent}
          />
        )}
        <Button
          to={readerPath}
          size="sm"
          className={progress ? undefined : "w-full"}
        >
          {openActionLabel(material, Boolean(progress))}
        </Button>
      </>
    );
  } else {
    actions = (
      <div className="w-full space-y-3">
        {progress && (
          <ProgressIndicator
            value={progress.percent}
            label={`${progress.percent}% complete`}
            showValue={pagePosition}
          />
        )}
        <Button to={readerPath} fullWidth>
          {openActionLabel(material, Boolean(progress))}
        </Button>
      </div>
    );
  }

  return {
    id: material.id,
    title: material.title,
    subtitle: material.author,
    cover: <BookCover material={material} size={compact ? "thumb" : "card"} />,
    coverOverlay: (
      <FavouriteToggle
        active={isFavourite}
        materialTitle={material.title}
        compact={compact}
        onToggle={() => onToggleFavourite(material.id)}
      />
    ),
    tag: { label: material.format },
    details: materialDetails(material, !compact),
    status,
    statusAside: progress ? formatTimeAgo(progress.lastReadAt) : undefined,
    aside: compact && progress ? `${progress.percent}%` : undefined,
    actions,
  };
}
