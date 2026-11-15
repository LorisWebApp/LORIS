/**
 * Group C – shared frontend types for the End User library experience.
 *
 * These describe the data the Dashboard and other Group C pages need.
 * The backend must eventually return this shape from GET /api/user/dashboard.
 */

export type MaterialFormat = "PDF" | "EPUB" | "MP3" | "MP4" | "DOCX" | "PPTX";

export type MaterialKind = "book" | "paper" | "audio" | "video";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

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
  percent: number;
  currentPage?: number;
  totalPages?: number;
  chapterTitle?: string;
  lastReadAt: string;
  completed: boolean;
}

export interface ShelfEntry {
  material: LibraryMaterial;
  progress: ReadingProgressSummary;
  isOffline: boolean;
}

export interface AnnotationSummary {
  id: string;
  type: "highlight" | "note";
  materialId: string;
  materialTitle: string;
  page: number;
  quote?: string;
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
  user: {
    firstName: string;
    displayName: string;
  };
  stats: DashboardStats;
  counts: DashboardCounts;
  currentlyReading: ShelfEntry | null;
  shelf: ShelfEntry[];
  favourites: LibraryMaterial[];
  bookmarked: LibraryMaterial[];
  favouriteIds: string[];
  annotations: AnnotationSummary[];
  offline: {
    downloads: OfflineDownloadSummary[];
  };
  recommended: LibraryMaterial[];
  lastSyncedAt: string | null;
}
