import { ProgressIndicator } from "../user/sharedUi";

export interface ReadingProgressProps {
  page: number;
  totalPages: number;
  className?: string;
}

/** Displays the current reading page, percentage and progress bar. */
export function ReadingProgress({
  page,
  totalPages,
  className,
}: ReadingProgressProps) {
  const safeTotal = Math.max(0, Math.floor(totalPages));
  const safePage =
    safeTotal > 0 ? Math.min(Math.max(1, Math.floor(page)), safeTotal) : 0;

  const percent = safeTotal > 0 ? Math.round((safePage / safeTotal) * 100) : 0;

  return (
    <ProgressIndicator
      className={className}
      tone="inverse"
      size="sm"
      value={percent}
      label={`Page ${safePage} of ${safeTotal}`}
      showValue={`${percent}%`}
    />
  );
}
