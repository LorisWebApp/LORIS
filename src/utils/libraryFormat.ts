import type { LibraryMaterial } from "../types/userLibrary.types";

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** 142 * 1024 * 1024 -> "142 MB", 2 GiB -> "2.0 GB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exp;
  // 42 MB (whole), 18.4 MB, 112 MB, 2.0 GB – whole numbers drop the decimal below GB.
  const digits =
    exp === 0 || value >= 100 || (exp < 3 && Number.isInteger(value)) ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[exp]}`;
}

/** "Just now", "25 mins ago", "2h ago", "3d ago", otherwise a short date. */
export function formatTimeAgo(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.max(0, Math.round((now - time) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from now until `iso` (negative when already past). */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function pluralise(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural;
}

/** Short facts shown beside the format tag, e.g. ["210 pages", "42 MB"]. Pass `includeSize: false` on narrow layouts. */
export function materialDetails(
  material: LibraryMaterial,
  includeSize = true,
): string[] {
  const details: string[] = [];
  if (material.durationMinutes)
    details.push(formatDuration(material.durationMinutes));
  else if (material.pageCount) details.push(`${material.pageCount} pages`);
  if (includeSize && material.fileSizeBytes)
    details.push(formatBytes(material.fileSizeBytes));
  return details;
}

/** Button label for opening a material in the reader/player. */
export function openActionLabel(
  material: LibraryMaterial,
  hasProgress: boolean,
): string {
  if (material.kind === "audio")
    return hasProgress ? "Continue listening" : "Listen";
  if (material.kind === "video")
    return hasProgress ? "Continue watching" : "Watch";
  return hasProgress ? "Continue" : "Read";
}
