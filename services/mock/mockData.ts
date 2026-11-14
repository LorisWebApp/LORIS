/**
 * In-memory store for the mock server (VITE_USE_MOCKS=true). It starts EMPTY: nothing here is seed data.
 * Everything the UI shows comes from what is entered through the UI (resets on page reload) until the real
 * backend is attached by pointing the services at it (see README, "Connecting the backend").
 * Shapes mirror docs/API_CONTRACT.md.
 */
import type { MaterialRow, Member } from '../../types/dashboard';
import type { InvitationCode, RenewalRequest } from '../../types/organisationAdmin';
import type { ConfigChange, LibraryConfig, RegistrationRequest, Ticket } from '../../types/platform';
import type { User } from '../../types/user';

export const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

// ---------- Users ----------
export interface MockUser extends User { password: string }

export const users: MockUser[] = [
  { id: 'u-admin', email: 'admin@loris.test', fullName: 'Admin', role: 'platform_admin', organisationId: null, organisationName: null, emailVerified: true, password: 'Password1' },
  { id: 'u-atla', email: 'atla@loris.test', fullName: 'Atla Admin', role: 'organisation_admin', organisationId: 'org-atla', organisationName: 'Atla Learning Centre', emailVerified: true, password: 'Password1' },
  { id: 'u-reader', email: 'reader@loris.test', fullName: 'Rae Reader', role: 'member', organisationId: 'org-atla', organisationName: 'Atla Learning Centre', emailVerified: true, password: 'Password1' },
];

/** Organisation each invitation code belongs to (code -> organisation). Filled when a code is generated. */
export const invitationCodes: Record<string, { id: string; name: string }> = {};

export const requests: RegistrationRequest[] = [];
export const tickets: Ticket[] = [];
export const readNotificationIds = new Set<string>();

/** Platform library configuration. Defaults only; `draft` and `recentChanges` stay empty until someone saves or publishes. */
export const libraryConfig: { published: LibraryConfig; draft: LibraryConfig | null; recentChanges: ConfigChange[] } = {
  published: { libraryName: 'Loris Web Library', organisationRegistration: 'manual', allowedTypes: ['Books', 'Videos', 'Images', 'Audio'], maxUploadMb: 50, defaultQuotaGb: 10, maintenanceMode: false },
  draft: null,
  recentChanges: [],
};

// ---------- Organisation area ----------
export const categories: string[] = [];
export const orgState = { pendingInvitations: 0 };
export const materials: MaterialRow[] = [];
/** `organisationId` is mock-only bookkeeping so each organisation only sees its own members. */
export const members: Array<Member & { organisationId?: string | null }> = [];
export const invitationCodeList: InvitationCode[] = [];
export const renewals: { accessEndsAt: string | null; requests: RenewalRequest[] } = { accessEndsAt: null, requests: [] };
