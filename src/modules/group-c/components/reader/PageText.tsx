import { useCallback } from "react";
import type { ClipboardEvent, DragEvent, MouseEvent } from "react";

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
  prefs: Preferences;
  onSelect: (selection: TextSelectionInfo | null) => void;
}

interface TextSegment {
  text: string;
  highlight?: Highlight;
}

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
      output.push({ text: text.slice(cursor, highlight.start) });
    }

    output.push({
      text: text.slice(highlight.start, highlight.end),
      highlight,
    });

    cursor = highlight.end;
  }

  if (cursor < text.length) {
    output.push({ text: text.slice(cursor) });
  }

  return output;
}

/**
 * Finds the paragraph even when the browser selection boundary
 * is positioned directly on the paragraph element.
 */
function getParagraphElement(node: Node): HTMLElement | null {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as Element).closest<HTMLElement>("[data-paragraph]");
  }

  return node.parentElement?.closest<HTMLElement>("[data-paragraph]") ?? null;
}

/**
 * Calculates a selection boundary's character position
 * relative to the beginning of its paragraph.
 */
function getTextOffset(
  paragraph: HTMLElement,
  container: Node,
  offset: number,
): number {
  const range = document.createRange();

  range.setStart(paragraph, 0);
  range.setEnd(container, offset);

  return range.toString().length;
}

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

    const startElement = getParagraphElement(range.startContainer);
    const endElement = getParagraphElement(range.endContainer);

    // Annotations are stored within one paragraph.
    // Selecting any amount of text inside that paragraph is allowed.
    if (!startElement || !endElement || startElement !== endElement) {
      onSelect(null);
      return;
    }

    const paragraphIndex = Number(startElement.getAttribute("data-paragraph"));

    if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0) {
      onSelect(null);
      return;
    }

    const paragraphText = page.paragraphs[paragraphIndex];

    if (typeof paragraphText !== "string" || !paragraphText.length) {
      onSelect(null);
      return;
    }

    let start: number;
    let end: number;

    try {
      start = getTextOffset(
        startElement,
        range.startContainer,
        range.startOffset,
      );

      end = getTextOffset(startElement, range.endContainer, range.endOffset);
    } catch {
      onSelect(null);
      return;
    }

    // Validate the calculated positions against the original paragraph.
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end > paragraphText.length ||
      end <= start
    ) {
      onSelect(null);
      return;
    }

    const exactSelectedText = paragraphText.slice(start, end);

    if (!exactSelectedText.trim()) {
      onSelect(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    onSelect({
      page: page.number,
      paragraph: paragraphIndex,
      start,
      end,
      text: exactSelectedText,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, [page, onSelect]);

  const preventCopyOrCut = useCallback((event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const preventPaste = useCallback((event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const preventContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const preventDrag = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const theme = READER_THEMES[prefs.reading.theme];
  const highContrast = prefs.accessibility.highContrast;

  const textColour = highContrast
    ? prefs.reading.theme === "light"
      ? "text-black"
      : "text-white"
    : theme.text;

  const safeFontScale =
    Number.isFinite(fontScale) && fontScale > 0
      ? Math.min(Math.max(fontScale, 0.5), 3)
      : 1;

  return (
    <article
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      onTouchEnd={handleSelection}
      onCopy={preventCopyOrCut}
      onCut={preventCopyOrCut}
      onPaste={preventPaste}
      onContextMenu={preventContextMenu}
      onDragStart={preventDrag}
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
