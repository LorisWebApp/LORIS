import { PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { USER_ROUTES } from "../../config/userRoutes";
import type {
  AnnotationSummary,
  HighlightColor,
} from "../../types/userLibrary.types";
import { formatTimeAgo } from "../../utils/libraryFormat";
import { Button, EmptyState, SectionHeader, StatusBadge, cx } from "./sharedUi";

export interface AnnotationFeedProps {
  annotations: AnnotationSummary[];
  isDesktop: boolean;
}

const DOT: Record<HighlightColor, string> = {
  yellow: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  pink: "bg-rose-400",
};
const WASH: Record<HighlightColor, string> = {
  yellow: "bg-amber-100",
  green: "bg-emerald-100",
  blue: "bg-sky-100",
  pink: "bg-rose-100",
};

function AnnotationItem({ annotation }: { annotation: AnnotationSummary }) {
  const color = annotation.color ?? "yellow";
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        to={USER_ROUTES.reader(annotation.materialId, annotation.page)}
        className="block px-1 py-4 transition-colors hover:bg-mint-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
      >
        <p className="flex flex-wrap items-center gap-x-2 text-[15px]">
          <span
            className={cx(
              "size-2 rounded-full",
              annotation.type === "highlight" ? DOT[color] : "bg-ink",
            )}
            aria-hidden
          />
          <span className="font-semibold text-deep">
            {annotation.materialTitle}
          </span>
          <span className="text-muted">· Page {annotation.page}</span>
          <span className="ml-auto text-muted">
            {formatTimeAgo(annotation.createdAt)}
          </span>
        </p>
        {annotation.quote && (
          <blockquote
            className={cx(
              "m-0 mt-2 px-3 py-2 font-serif text-[17px] italic leading-6 text-ink",
              annotation.type === "highlight"
                ? WASH[color]
                : "border-l-2 border-line",
            )}
          >
            “{annotation.quote}”
          </blockquote>
        )}
        {annotation.note && (
          <p className="mt-2 flex items-start gap-2 text-[15px] leading-6 text-ink/80">
            <StatusBadge
              size="sm"
              variant="info"
              label="Note"
              className="mt-0.5"
            />
            <span>{annotation.note}</span>
          </p>
        )}
      </Link>
    </li>
  );
}

/** "Recent Annotations & Notes" (desktop list) / "Recent Highlight & Note" (mobile, latest one). */
export function AnnotationFeed({
  annotations,
  isDesktop,
}: AnnotationFeedProps) {
  const shown = isDesktop ? annotations.slice(0, 4) : annotations.slice(0, 1);

  return (
    <section
      aria-label="Recent annotations"
      className={isDesktop ? undefined : "px-4"}
    >
      {isDesktop ? (
        <SectionHeader
          title="Recent Annotations & Notes"
          description="Your latest highlights and margin notes."
          actions={
            <Button to={USER_ROUTES.notes} variant="text" size="sm">
              View all notes ›
            </Button>
          }
          divider
        />
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 font-serif text-[22px] font-medium leading-tight text-deep">
            Recent Highlight &amp; Note
          </h2>
          <Button to={USER_ROUTES.notes} variant="text" size="sm">
            View all ›
          </Button>
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState
          icon={<PenLine size={28} />}
          title="No annotations yet"
          description="Highlights and notes you make while reading appear here."
          className="py-8"
        />
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {shown.map((a) => (
            <AnnotationItem key={a.id} annotation={a} />
          ))}
        </ul>
      )}
    </section>
  );
}
