import { useCallback } from "react";

import type { Highlight, ReaderPage } from "../../types/reader.types";
import type { Preferences } from "../../services/preferences.service";

import { cx } from "../user/sharedUi";
import type { TextSelectionInfo } from "./HighlightTool";
import { HIGHLIGHT_WASH } from "./highlightStyles";
import { LINE_HEIGHT, READER_THEMES } from "./readerTheme";

export interface PageTextProps {
  page: ReaderPage;
  chapterTitle?: string;
  highlights: Highlight[];
  fontScale: number;
  /** Reading preferences from Settings. */
  prefs: Preferences;
  onSelect: (selection: TextSelectionInfo | null) => void;
}

interface TextSegment {
  text: string;
  highlight?: Highlight;
}

/** Splits paragraph text into normal and highlighted segments. */
function split(text: string, highlights: Highlight[]): TextSegment[] {
  const output: TextSegment[] = [];
  let cursor = 0;

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  for (const highlight of sortedHighlights) {
    if (
      !Number.isInteger(highlight.start) ||
      !Number.isInteger(highlight.end) ||
      highlight.start < cursor ||
      highlight.start < 0 ||
      highlight.end > text.length ||
      highlight.end <= highlight.start
    ) {
      continue;
    }

    if (highlight.start > cursor) {
      output.push({
        text: text.slice(cursor, highlight.start),
      });
    }

    output.push({
      text: text.slice(highlight.start, highlight.end),
      highlight,
    });

    cursor = highlight.end;
  }

  if (cursor < text.length) {
    output.push({
      text: text.slice(cursor),
    });
  }

  return output;
}

/** One page of text with highlights and text-selection support. */
export function PageText({
  page,
  chapterTitle,
  highlights,
  fontScale,
  prefs,
  onSelect,
}: PageTextProps) {
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      onSelect(null);
      return;
    }

    const range = selection.getRangeAt(0);

    const startElement =
      range.startContainer.parentElement?.closest<HTMLElement>(
        "[data-paragraph]",
      );

    const endElement =
      range.endContainer.parentElement?.closest<HTMLElement>(
        "[data-paragraph]",
      );

    const selectedText = selection.toString();

    // Only support selections within a single paragraph.
    if (!startElement || startElement !== endElement || !selectedText.trim()) {
      onSelect(null);
      return;
    }

    const paragraphIndex = Number(startElement.getAttribute("data-paragraph"));

    if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0) {
      onSelect(null);
      return;
    }

    const paragraphText = page.paragraphs[paragraphIndex];

    if (typeof paragraphText !== "string") {
      onSelect(null);
      return;
    }

    const beforeRange = document.createRange();

    try {
      beforeRange.selectNodeContents(startElement);
      beforeRange.setEnd(range.startContainer, range.startOffset);
    } catch {
      onSelect(null);
      return;
    }

    const start = beforeRange.toString().length;
    const end = start + selectedText.length;

    if (start < 0 || end > paragraphText.length || end <= start) {
      onSelect(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    onSelect({
      page: page.number,
      paragraph: paragraphIndex,
      start,
      end,
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, [page, onSelect]);

  const theme = READER_THEMES[prefs.reading.theme];
  const highContrast = prefs.accessibility.highContrast;

  const textColour = highContrast
    ? prefs.reading.theme === "light"
      ? "text-black"
      : "text-white"
    : theme.text;

  const safeFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;

  return (
    <article
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      aria-label={`Page ${page.number}`}
      className={cx(
        "mx-auto w-full px-8 py-12 shadow-[0_2px_16px_rgba(5,32,30,0.08)] sm:px-16",
        prefs.reading.layout === "wide" ? "max-w-[960px]" : "max-w-[720px]",
        theme.page,
      )}
      style={{
        fontSize: `${18 * safeFontScale}px`,
        letterSpacing: prefs.accessibility.letterSpacing ? "0.03em" : undefined,
      }}
    >
      {chapterTitle && (
        <p
          className={cx(
            "m-0 text-center text-[0.65em] font-semibold uppercase tracking-[0.2em]",
            theme.muted,
          )}
        >
          {chapterTitle}
        </p>
      )}

      <div
        className={cx("mt-8 space-y-[1em] font-serif", textColour)}
        style={{
          lineHeight: LINE_HEIGHT[prefs.reading.lineSpacing],
        }}
      >
        {page.paragraphs.map((paragraph, index) => (
          <p
            key={`${page.number}-${index}`}
            data-paragraph={index}
            className="m-0"
          >
            {split(
              paragraph,
              highlights.filter((highlight) => highlight.paragraph === index),
            ).map((segment, segmentIndex) =>
              segment.highlight ? (
                <mark
                  key={segmentIndex}
                  data-highlight-id={segment.highlight.id}
                  className={cx(
                    "rounded-[2px] text-ink",
                    HIGHLIGHT_WASH[segment.highlight.color],
                  )}
                >
                  {segment.text}
                </mark>
              ) : (
                <span key={segmentIndex}>{segment.text}</span>
              ),
            )}
          </p>
        ))}
      </div>

      <p className={cx("mb-0 mt-10 text-center text-[0.7em]", theme.muted)}>
        {page.number}
      </p>
    </article>
  );
}
