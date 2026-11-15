import type { HighlightColor } from "../../types/userLibrary.types";

/** Available highlight colours in the reader. */
export const HIGHLIGHT_COLORS: HighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "pink",
];

/** Background colours applied to highlighted text. */
export const HIGHLIGHT_WASH: Record<HighlightColor, string> = {
  yellow: "bg-amber-200",
  green: "bg-emerald-200",
  blue: "bg-sky-200",
  pink: "bg-rose-200",
};

/** Small colour swatches used in the highlight toolbar. */
export const HIGHLIGHT_DOT: Record<HighlightColor, string> = {
  yellow: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  pink: "bg-rose-400",
};
