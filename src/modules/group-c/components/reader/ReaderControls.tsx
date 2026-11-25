import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../user/sharedUi";

export interface ReaderControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
  fontScale: number;
  onFontScale: (scale: number) => void;
}

export const FONT_SCALES = [0.9, 1, 1.15, 1.3, 1.5] as const;

/** Floating bottom bar: navigation, page selection and text size. */
export function ReaderControls({
  page,
  totalPages,
  onPrev,
  onNext,
  onJump,
  fontScale,
  onFontScale,
}: ReaderControlsProps) {
  const [draft, setDraft] = useState(String(page));

  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safePage = Math.min(Math.max(1, page), safeTotal);

  const currentFontIndex = FONT_SCALES.reduce(
    (closest, scale, index) =>
      Math.abs(scale - fontScale) < Math.abs(FONT_SCALES[closest] - fontScale)
        ? index
        : closest,
    0,
  );

  const commit = () => {
    const requestedPage = Number(draft);

    if (
      draft.trim() === "" ||
      !Number.isInteger(requestedPage) ||
      requestedPage < 1 ||
      requestedPage > safeTotal
    ) {
      setDraft(String(safePage));
      return;
    }

    onJump(requestedPage);
  };

  const handlePageInput = (value: string) => {
    setDraft(value.replace(/\D/g, ""));
  };

  return (
    <div
      role="toolbar"
      aria-label="Reader controls"
      className="fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-16px)] -translate-x-1/2 items-center gap-1 rounded-full bg-deep px-2 py-1.5 text-white shadow-[0_8px_24px_rgba(5,32,30,0.35)]"
    >
      <Button
        type="button"
        variant="text"
        tone="inverse"
        size="sm"
        onClick={onPrev}
        disabled={safePage <= 1}
        leftIcon={<ChevronLeft size={16} aria-hidden="true" />}
      >
        Prev
      </Button>

      <label className="flex shrink-0 items-center gap-1.5 px-1 text-[14px]">
        <span className="sr-only">Go to page</span>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          aria-label="Go to page"
          onChange={(event) => handlePageInput(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit();
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              setDraft(String(safePage));
              event.currentTarget.blur();
            }
          }}
          className="w-10 rounded bg-white/10 px-1 py-0.5 text-center text-white outline-none focus:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        />

        <span className="text-white/70">/ {safeTotal}</span>
      </label>

      <Button
        type="button"
        variant="text"
        tone="inverse"
        size="sm"
        onClick={onNext}
        disabled={safePage >= safeTotal}
        rightIcon={<ChevronRight size={16} aria-hidden="true" />}
      >
        Next
      </Button>

      <span className="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      <Button
        type="button"
        variant="icon"
        tone="inverse"
        size="sm"
        aria-label="Smaller text"
        disabled={currentFontIndex === 0}
        onClick={() => onFontScale(FONT_SCALES[currentFontIndex - 1])}
      >
        <Minus size={14} aria-hidden="true" />
      </Button>

      <span
        className="w-9 shrink-0 text-center text-[13px] text-white/80"
        aria-live="polite"
      >
        {Math.round(fontScale * 100)}%
      </span>

      <Button
        type="button"
        variant="icon"
        tone="inverse"
        size="sm"
        aria-label="Larger text"
        disabled={currentFontIndex === FONT_SCALES.length - 1}
        onClick={() => onFontScale(FONT_SCALES[currentFontIndex + 1])}
      >
        <Plus size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}
