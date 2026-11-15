import type {
  HighlightColor,
  MaterialFormat,
  LibraryMaterial,
  ShelfEntry,
} from "./userLibrary.types";

/**
 * READER DOCUMENT TYPES
 *
 * These represent the structured content displayed by the Reader.
 * A future backend adapter will convert PDF/EPUB content into this format.
 */

export interface ReaderPage {
  number: number;
  chapterId: string;
  paragraphs: string[];
}

export interface ReaderChapter {
  id: string;
  title: string;
  /** First page of the chapter. */
  page: number;
}

export interface ReaderDocument {
  id: string;
  title: string;
  author: string;
  format: MaterialFormat;
  chapters: ReaderChapter[];
  pages: ReaderPage[];
}

/**
 * BOOKMARK TYPES
 */

export interface Bookmark {
  id: string;
  materialId: string;
  materialTitle: string;
  page: number;
  label: string;
  createdAt: string;
}

export type NewBookmark = Omit<Bookmark, "id" | "createdAt">;

/**
 * NOTE TYPES
 */

export interface Note {
  id: string;
  materialId: string;
  materialTitle: string;
  page: number;
  text: string;
  /** Passage the note is attached to, if any. */
  quote?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewNote = Omit<Note, "id" | "createdAt" | "updatedAt">;

/**
 * HIGHLIGHT TYPES
 */

export interface Highlight {
  id: string;
  materialId: string;
  materialTitle: string;
  page: number;

  /** Paragraph index and character positions within that paragraph. */
  paragraph: number;
  start: number;
  end: number;

  text: string;
  color: HighlightColor;
  createdAt: string;
}

export type NewHighlight = Omit<Highlight, "id" | "createdAt">;

/**
 * READING PROGRESS
 */

export interface SavedProgress {
  materialId: string;
  page: number;
  totalPages: number;
  percent: number;
  completed: boolean;
  updatedAt: string;
}

/**
 * DASHBOARD OVERVIEW
 */

export interface LibraryOverview {
  favourites: LibraryMaterial[];
  inProgress: ShelfEntry[];
  completed: ShelfEntry[];
}

/**
 * USER PROFILE
 */

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  organisationName?: string;
  avatarUrl?: string | null;
}

/**
 * GENERAL ACTION RESULT
 */

export interface ActionResult {
  ok: boolean;
  message: string;
}
