/**
 * Group C – shared frontend types for the End User library experience.
 * These describe the data the Dashboard needs. The backend (built later) must return this shape
 * from GET /api/user/dashboard – see README "API contract".
 */

export type MaterialFormat = "PDF" | "EPUB" | "MP3" | "MP4" | "DOCX" | "PPTX";

/** Drives the shelf filter tabs and the action label (Read / Listen / Watch). */
export type MaterialKind = "book" | "paper" | "audio" | "video";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

/** Minimal material information needed to draw a card. Group B owns the full material model. */
export interface LibraryMaterial {
  id: string;
  title: string;
  author: string;
  category: string;
  format: MaterialFormat;
  kind: MaterialKind;
  coverUrl?: string | null;
  pageCount?: number;
  durationMinutes?: number;
  fileSizeBytes?: number;
}

export interface ReadingProgressSummary {
  materialId: string;
  /** 0–100 */
  percent: number;
  currentPage?: number;
  totalPages?: number;
  chapterTitle?: string;
  /** ISO timestamp */
  lastReadAt: string;
  completed: boolean;
}

export interface ShelfEntry {
  material: LibraryMaterial;
  progress: ReadingProgressSummary;
  /** True when a valid offline copy exists for this user. */
  isOffline: boolean;
}

export interface AnnotationSummary {
  id: string;
  type: "highlight" | "note";
  materialId: string;
  materialTitle: string;
  page: number;
  /** Highlighted passage (highlights) or the passage a note is attached to. */
  quote?: string;
  /** The user's own note text. */
  note?: string;
  color?: HighlightColor;
  createdAt: string;
}

export type OfflineDownloadStatus =
  | "ready"
  | "downloading"
  | "expired"
  | "failed";

export interface OfflineDownloadSummary {
  id: string;
  material: LibraryMaterial;
  sizeBytes: number;
  downloadedAt: string;
  /** ISO timestamp, or null when the copy does not expire. */
  expiresAt: string | null;
  status: OfflineDownloadStatus;
}

export interface DashboardStats {
  activeBooks: number;
  notesAndQuotes: number;
  offlineReady: number;
  readingStreakDays: number;
}

export interface DashboardCounts {
  inProgress: number;
  favourites: number;
  bookmarks: number;
}

export interface DashboardData {
  user: { firstName: string; displayName: string };
  stats: DashboardStats;
  counts: DashboardCounts;
  /** The most recently opened unfinished material, or null for a brand-new user. */
  currentlyReading: ShelfEntry | null;
  shelf: ShelfEntry[];
  /** Most recent favourites / bookmarked materials (the full lists live on the Favourites page). */
  favourites: LibraryMaterial[];
  bookmarked: LibraryMaterial[];
  /** IDs of every material the user has favourited (used to draw the toggle state). */
  favouriteIds: string[];
  annotations: AnnotationSummary[];
  offline: { downloads: OfflineDownloadSummary[] };
  recommended: LibraryMaterial[];
  /** ISO timestamp of the last successful sync, or null if never synced. */
  lastSyncedAt: string | null;
}
