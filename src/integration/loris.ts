/**
 * Integration boundary between Group D and the other LORIS groups.
 * Everything another group owns is isolated here so it can be swapped later.
 */
import { createLorisApiAdapter } from '../group-d/offline/apiAdapter';
import type { OfflineMaterialMetadata } from '../group-d/types/models';

/* ---------- Group A: authentication (not yet connected) ---------- */
export interface CurrentUser {
  id: string;
  initials: string;
}
/** TEMPORARY: replace with Group A's session/user hook. */
export function useCurrentUser(): CurrentUser {
  return { id: 'local-user', initials: 'JL' };
}
/** Group A should return the real bearer token. `null` means "not signed in". */
export async function getAccessToken(): Promise<string | null> {
  return null;
}

/* ---------- Notifications & account menu (owned by other groups) ---------- */
import type { NotificationItem, UserMenuEntry } from '../components/shared';
/** TEMPORARY: replace with the shared notification source. */
export function useNotifications(): NotificationItem[] {
  return [];
}
export const USER_MENU_ITEMS: UserMenuEntry[] = [
  { label: 'My Library', to: '/my-library' },
  { label: 'Offline Library', to: '/offline-library' },
  { divider: true },
  { label: 'System Support', to: '/support' },
];

/* ---------- Routes owned by other groups ---------- */
export const ROUTES = {
  browse: '/browse',
  myLibrary: '/my-library',
  offlineLibrary: '/offline-library',
  assistant: '/assistant',
  support: '/support',
} as const;

/* ---------- Group B/A/C: API adapter (contracts in docs/API_CONTRACTS.md) ---------- */
export const lorisApi = createLorisApiAdapter({ getAccessToken });

/* ---------- Group C: reader ---------- */
export interface ReaderRequest {
  metadata: OfflineMaterialMetadata;
  /** Object URL for the stored blob. The reader must revoke it when finished. */
  objectUrl: string;
}
export type ReaderOpener = (request: ReaderRequest) => void;

let readerOpener: ReaderOpener | null = null;
/** Group C calls this once its reader exists. */
export function registerReader(opener: ReaderOpener): void {
  readerOpener = opener;
}
/** Thrown when a material is opened before Group C's reader has been registered. */
export class ReaderNotConnectedError extends Error {}
export function isReaderConnected(): boolean {
  return readerOpener !== null;
}
export function openInReader(request: ReaderRequest): void {
  if (!readerOpener) throw new ReaderNotConnectedError('Access verified, but the LORIS reader (Group C) is not connected yet.');
  readerOpener(request);
}

/* ---------- Support / institution details (configurable placeholders) ---------- */
export const INSTITUTION = {
  name: 'Atlas Institute',
  supportEmail: 'archives@atlasinstitute.edu',
  supportDesk: 'Mon–Fri 9:00 AM – 5:00 PM EST',
  readingRoom: 'Level 3, Special Collections Wing',
} as const;
