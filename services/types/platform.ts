/** Shapes returned by the Platform Manager endpoints (`/platform/...`). */

export interface Page<T> {
  items: T[];
  total: number;
}

/* ---------- Registration requests ---------- */

export type RequestStatus = 'pending' | 'more_details' | 'accepted' | 'rejected';
export type RequestDecision = 'accept' | 'reject' | 'more_details';

export interface RegistrationRequest {
  id: string;
  reference: string;
  organisationName: string;
  email: string;
  organisationType: string;
  country: string;
  provinceOrState: string;
  cityOrTown: string;
  postalCode: string;
  submittedBy: string;
  submittedAt: string;
  status: RequestStatus;
  /** Last message the platform manager sent to the organisation, if any. */
  decisionMessage?: string | null;
  /** Questions asked and the organisation's replies, oldest first. */
  thread?: Array<{ id: string; from: 'platform' | 'organisation'; message: string; at: string }>;
}

export interface RequestPage extends Page<RegistrationRequest> {
  counts: Record<RequestStatus, number>;
}

export interface RequestQuery {
  status: RequestStatus;
  q: string;
  sort: 'newest' | 'oldest';
  page: number;
  pageSize: number;
}

/* ---------- Organisations, activity ---------- */

export interface OrganisationSummary {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  members: number;
  joinedAt: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

/* ---------- Overview ---------- */

export interface PlatformOverview {
  activeUsers: number;
  usersOnlineNow: number;
  activeOrganisations: number;
  organisationsOnlineNow: number;
  pendingRequests: number;
  requestsToday: number;
  openTickets: number;
  ticketsAwaitingReply: number;
  materials: { total: number; books: number; videos: number; images: number; audio: number };
  /** `totalGb` of 0 means the backend does not report storage yet. */
  storage: { usedGb: number; totalGb: number };
  newestRequests: Array<{ id: string; organisationName: string; organisationType: string; country: string; submittedAt: string }>;
  activity: Array<{ id: string; title: string; detail: string; at: string }>;
  healthMessage?: string | null;
}

/* ---------- Notifications ---------- */

export interface PlatformNotification {
  id: string;
  headline: string;
  label: string;
  detail: string;
  at: string;
  /** App path to open when the notification is selected. */
  link: string;
  read: boolean;
}

export interface PlatformShell {
  notifications: PlatformNotification[];
  unread: number;
}

/* ---------- System monitoring ---------- */

export type ServiceHealth = 'operational' | 'degraded' | 'down';

export interface SystemService {
  id: string;
  name: string;
  status: ServiceHealth;
  detail?: string | null;
}

export interface SystemStatus {
  services: SystemService[];
  storage: { usedGb: number; totalGb: number };
  healthMessage?: string | null;
  checkedAt?: string | null;
}

/* ---------- Library system configuration ---------- */

export const MATERIAL_TYPES = ['Books', 'Videos', 'Images', 'Audio', 'Documents', 'Presentations'] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export interface LibraryConfig {
  libraryName: string;
  organisationRegistration: 'manual' | 'automatic';
  allowedTypes: MaterialType[];
  maxUploadMb: number;
  defaultQuotaGb: number;
  maintenanceMode: boolean;
}

export interface LibraryConfigState {
  published: LibraryConfig;
  /** Saved but unpublished changes, or `null`. */
  draft: LibraryConfig | null;
  recentChanges: Array<{ id: string; title: string; publishedAt: string; by: string }>;
}
