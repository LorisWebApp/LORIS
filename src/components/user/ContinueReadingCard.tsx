import { ArrowRight, CircleCheck, Cloud } from "lucide-react";
import { USER_ROUTES } from "../../config/userRoutes";
import type { ShelfEntry } from "../../types/userLibrary.types";
import { formatTimeAgo } from "../../utils/libraryFormat";
import { BookCover } from "./BookCover";
import { Button, ProgressIndicator, StatusBadge, cx } from "./sharedUi";

export interface ContinueReadingCardProps {
  entry: ShelfEntry;
  /** "Currently reading" (desktop hero) or "Jump back in" (mobile). */
  heading: string;
  resumeLabel: string;
  /** `on-dark` sits inside the dark hero band; `solid` is a standalone dark card (mobile). */
  surface: "on-dark" | "solid";
  className?: string;
}

/** The "pick up where you left off" card: cover, chapter, progress and a Resume button. */
export function ContinueReadingCard({
  entry,
  heading,
  resumeLabel,
  surface,
  className,
}: ContinueReadingCardProps) {
  const { material, progress, isOffline } = entry;
  const solid = surface === "solid";
  const pages =
    progress.currentPage && progress.totalPages
      ? `${progress.currentPage} / ${progress.totalPages} pages`
      : undefined;

  return (
    <section
      aria-label={heading}
      className={cx(
        "rounded-lg p-5 text-white",
        solid ? "bg-ink" : "border border-white/15 bg-white/5",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h2
          className={cx(
            "m-0 flex items-center gap-2",
            solid
              ? "text-[12px] font-bold uppercase tracking-[0.14em] text-white/90"
              : "text-[16px] font-medium text-white/90",
          )}
        >
          {!solid && (
            <span className="size-1.5 rounded-full bg-badge" aria-hidden />
          )}
          {heading}
        </h2>
        {solid ? (
          isOffline && (
            <StatusBadge size="sm" variant="accent" label="Offline ready" />
          )
        ) : (
          <span className="text-[15px] text-white/65">
            {formatTimeAgo(progress.lastReadAt)}
          </span>
        )}
      </header>

      <div className="mt-4 flex gap-4">
        <div className="h-[104px] w-[76px] shrink-0 overflow-hidden rounded-[4px]">
          <BookCover material={material} size="thumb" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-white/70">
            <StatusBadge label={material.format} variant="accent" size="sm" />
            {progress.chapterTitle && <span>{progress.chapterTitle}</span>}
          </p>
          <h3 className="mt-1.5 font-serif text-[24px] font-medium leading-tight text-white">
            {material.title}
          </h3>
          <p className="mt-0.5 text-[16px] text-white/70">{material.author}</p>
          <ProgressIndicator
            className="mt-3"
            tone="inverse"
            value={progress.percent}
            label={solid ? "Progress" : `Progress: ${progress.percent}%`}
            showValue={solid ? `${progress.percent}%` : pages}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] text-white/75">
          {isOffline ? (
            <>
              <CircleCheck size={15} className="text-badge" aria-hidden /> Ready
              for offline reading
            </>
          ) : (
            <>
              <Cloud size={15} aria-hidden /> Online only
            </>
          )}
        </p>
        <Button
          to={USER_ROUTES.reader(material.id)}
          tone="inverse"
          rightIcon={<ArrowRight size={16} aria-hidden />}
        >
          {resumeLabel}
        </Button>
      </div>
    </section>
  );
}
