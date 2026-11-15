/** Integration boundary for Group D's offline and assistant interfaces. */
import { useAuth } from '../modules/group-a/contexts/AuthContext';
import { supabase } from '../services/supabase';
import { createLorisApiAdapter } from '../group-d/offline/apiAdapter';
import type { OfflineMaterialMetadata } from '../group-d/types/models';
import type { NotificationItem, UserMenuEntry } from '../components/shared';

export interface CurrentUser { id: string; initials: string }

/** Uses the single Group A Supabase session and profile. */
export function useCurrentUser(): CurrentUser {
  const { user, profile } = useAuth();
  const name = profile?.full_name || user?.email || 'LORIS user';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'LU';
  return { id: user?.id ?? '', initials };
}

export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

/** Notification persistence is not in the supplied schema; never fabricate notifications. */
export function useNotifications(): NotificationItem[] { return []; }

export const USER_MENU_ITEMS: UserMenuEntry[] = [
  { label: 'My Library', to: '/user/my-library' },
  { label: 'Offline Library', to: '/offline-library' },
  { divider: true },
  { label: 'System Support', to: '/user/support' },
];

export const ROUTES = {
  browse: '/catalogue',
  myLibrary: '/user/my-library',
  offlineLibrary: '/offline-library',
  support: '/user/support',
} as const;

export const lorisApi = createLorisApiAdapter({ getAccessToken });

export interface ReaderRequest { metadata: OfflineMaterialMetadata; objectUrl: string }
export type ReaderOpener = (request: ReaderRequest) => void;
let readerOpener: ReaderOpener | null = null;
export function registerReader(opener: ReaderOpener): void { readerOpener = opener; }
export class ReaderNotConnectedError extends Error {}
export function isReaderConnected(): boolean { return readerOpener !== null; }
export function openInReader(request: ReaderRequest): void {
  if (!readerOpener) throw new ReaderNotConnectedError('The reader route is not connected to Group D offline material yet.');
  readerOpener(request);
}

export const INSTITUTION = {
  name: 'LORIS',
  supportEmail: '',
  supportDesk: 'Contact your organisation administrator for support.',
  readingRoom: 'LORIS digital library',
} as const;
