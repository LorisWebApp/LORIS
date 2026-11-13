/**
 * Mock data for the Dashboard, used while the Group C backend is not available
 * (see USE_MOCK_DATA in services/userApi.ts). Timestamps are relative to "now".
 * Delete this file once the real API is wired in.
 */
import type {
  AnnotationSummary,
  DashboardData,
  LibraryMaterial,
  OfflineDownloadSummary,
  ShelfEntry,
} from "../types/userLibrary.types";

const MB = 1024 * 1024;
const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 86_400_000).toISOString();

const attention: LibraryMaterial = {
  id: "m-001",
  title: "The Art of Paying Attention",
  author: "Elena Rivers",
  category: "Personal Growth",
  format: "EPUB",
  kind: "book",
  pageCount: 210,
  fileSizeBytes: 42 * MB,
};
const beneath: LibraryMaterial = {
  id: "m-002",
  title: "Beneath the Blue",
  author: "Dr. Maya Chen",
  category: "Science & Nature",
  format: "PDF",
  kind: "paper",
  pageCount: 248,
  fileSizeBytes: 112 * MB,
};
const cities: LibraryMaterial = {
  id: "m-003",
  title: "Cities for Tomorrow",
  author: "Alan Reyes",
  category: "Design & Society",
  format: "MP4",
  kind: "video",
  durationMinutes: 94,
  fileSizeBytes: 96 * MB,
};
const fieldGuide: LibraryMaterial = {
  id: "m-004",
  title: "A Field Guide to Good Design",
  author: "Marcus Bell",
  category: "Applied Design",
  format: "PDF",
  kind: "book",
  pageCount: 186,
  fileSizeBytes: 88 * MB,
};
const forest: LibraryMaterial = {
  id: "m-005",
  title: "The Living Forest",
  author: "Sofia Lindqvist",
  category: "Science & Nature",
  format: "MP3",
  kind: "audio",
  durationMinutes: 312,
  fileSizeBytes: 82 * MB,
};
const elsewhere: LibraryMaterial = {
  id: "m-006",
  title: "A Map of Elsewhere",
  author: "Ingrid Novak",
  category: "Literature & Fiction",
  format: "EPUB",
  kind: "book",
  pageCount: 264,
  fileSizeBytes: 3 * MB,
};
const botanical: LibraryMaterial = {
  id: "m-007",
  title: "Botanical Forms: An Archive",
  author: "Hanna Weiss",
  category: "Art & History",
  format: "PDF",
  kind: "book",
  pageCount: 150,
  fileSizeBytes: 64 * MB,
};

const shelf: ShelfEntry[] = [
  {
    material: attention,
    isOffline: true,
    progress: {
      materialId: "m-001",
      percent: 68,
      currentPage: 142,
      totalPages: 210,
      chapterTitle: "Chapter 7: Deep Focus",
      lastReadAt: minutesAgo(25),
      completed: false,
    },
  },
  {
    material: beneath,
    isOffline: true,
    progress: {
      materialId: "m-002",
      percent: 20,
      currentPage: 50,
      totalPages: 248,
      chapterTitle: "Chapter 2: Thermal Layers",
      lastReadAt: minutesAgo(60 * 5),
      completed: false,
    },
  },
  {
    material: cities,
    isOffline: true,
    progress: {
      materialId: "m-003",
      percent: 45,
      lastReadAt: minutesAgo(60 * 26),
      completed: false,
    },
  },
];

const annotations: AnnotationSummary[] = [
  {
    id: "a-1",
    type: "highlight",
    materialId: "m-001",
    materialTitle: attention.title,
    page: 142,
    color: "yellow",
    quote:
      "Attention is not a passive sensory filter; it is the currency through which conscious reality is financed.",
    note: "Link to my notes on deep focus.",
    createdAt: minutesAgo(40),
  },
  {
    id: "a-2",
    type: "note",
    materialId: "m-002",
    materialTitle: beneath.title,
    page: 51,
    quote:
      "Thermal stratification limits vertical mixing during the summer months.",
    note: "Cross-reference with Chapter 3 on thermal stratification.",
    createdAt: minutesAgo(60 * 6),
  },
  {
    id: "a-3",
    type: "highlight",
    materialId: "m-003",
    materialTitle: cities.title,
    page: 12,
    color: "green",
    quote:
      "A walkable street is the cheapest piece of public infrastructure a city can build.",
    createdAt: minutesAgo(60 * 30),
  },
];

const downloads: OfflineDownloadSummary[] = [
  {
    id: "d-1",
    material: attention,
    sizeBytes: 42 * MB,
    downloadedAt: minutesAgo(60 * 24 * 2),
    expiresAt: daysFromNow(28),
    status: "ready",
  },
  {
    id: "d-2",
    material: beneath,
    sizeBytes: 112 * MB,
    downloadedAt: minutesAgo(60 * 24 * 4),
    expiresAt: daysFromNow(26),
    status: "ready",
  },
  {
    id: "d-3",
    material: cities,
    sizeBytes: 96 * MB,
    downloadedAt: minutesAgo(60 * 24 * 27),
    expiresAt: daysFromNow(3),
    status: "ready",
  },
  {
    id: "d-4",
    material: fieldGuide,
    sizeBytes: 88 * MB,
    downloadedAt: minutesAgo(60 * 24 * 10),
    expiresAt: daysFromNow(20),
    status: "ready",
  },
  {
    id: "d-5",
    material: forest,
    sizeBytes: 82 * MB,
    downloadedAt: minutesAgo(60 * 24 * 15),
    expiresAt: daysFromNow(15),
    status: "ready",
  },
];

export function createMockDashboard(): DashboardData {
  return {
    user: { firstName: "Jonathan", displayName: "Jonathan Lee" },
    stats: {
      activeBooks: shelf.length,
      notesAndQuotes: 42,
      offlineReady: downloads.filter((d) => d.status === "ready").length,
      readingStreakDays: 12,
    },
    counts: { inProgress: shelf.length, favourites: 14, bookmarks: 23 },
    currentlyReading: shelf[0],
    shelf,
    favourites: [elsewhere, fieldGuide, forest],
    bookmarked: [attention, beneath, botanical],
    favouriteIds: ["m-001", "m-004", "m-006"],
    annotations,
    offline: { downloads },
    recommended: [elsewhere, forest, fieldGuide, botanical],
    lastSyncedAt: minutesAgo(0),
  };
}
