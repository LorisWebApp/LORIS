import type {
  LineSpacing,
  ReaderTheme,
} from "../../services/preferences.service";

/**
 * Reading-surface themes.
 * The application chrome stays light.
 * Colours follow the Group B Velvet Teal design system.
 */
export const READER_THEMES: Record<
  ReaderTheme,
  {
    surface: string;
    page: string;
    text: string;
    muted: string;
  }
> = {
  light: {
    surface: "bg-[#F8FAFC]",
    page: "bg-white",
    text: "text-[#0B1B1D]",
    muted: "text-[#667085]",
  },

  sepia: {
    surface: "bg-[#E9DFC6]",
    page: "bg-[#F4ECD8]",
    text: "text-[#3B2F1D]",
    muted: "text-[#7A6A4F]",
  },

  dark: {
    surface: "bg-[#062B2E]",
    page: "bg-[#0A3D42]",
    text: "text-[#F0FAFB]",
    muted: "text-[#A8D9DC]",
  },
};

/** Line-height values used by the reader's typography preferences. */
export const LINE_HEIGHT: Record<LineSpacing, number> = {
  compact: 1.5,
  normal: 1.75,
  relaxed: 2.1,
};
