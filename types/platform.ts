export type RequestStatus = 'pending' | 'more_details' | 'accepted' | 'rejected';
export type RequestDecision = 'accept' | 'reject' | 'more_details';

export interface RegistrationRequest {
  id: string;
  /** Human-readable reference, e.g. REQ-0052. */
  reference: string;
  organisationName: string;
  email: string;
  organisationType: string;
  country: string;
  provinceOrState: string;
  cityOrTown: string;
  postalCode: string;
  submittedBy?: string;
  /** ISO timestamp. */
  submittedAt: string;
  status: RequestStatus;
  /** Message sent with the last decision (e.g. the details that were asked for). */
  decisionMessage?: string;
}

export interface RequestsPage {
  items: RegistrationRequest[];
  total: number;
  counts: Record<RequestStatus, number>;
}

export interface RequestsQuery {
  status: RequestStatus;
  q?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface OrganisationSummary {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  members: number;
  joinedAt: string;
}

export type TicketStatus = 'open' | 'resolved';
export type TicketPriority = 'high' | 'normal' | 'low';
export type TicketFilter = 'open' | 'awaiting_reply' | 'resolved';

export interface TicketMessage {
  id: string;
  author: string;
  authorType: 'organisation' | 'admin';
  body: string;
  sentAt: string;
  attachment?: { name: string; sizeKb: number };
}

export interface Ticket {
  id: string;
  /** e.g. SUP-1042 */
  reference: string;
  subject: string;
  organisationName: string;
  contactEmail: string;
  priority: TicketPriority;
  assignee: string;
  receivedAt: string;
  status: TicketStatus;
  /** True while the last message is from the organisation (needs an admin reply). */
  awaitingReply: boolean;
  messages: TicketMessage[];
}

export interface TicketsPage {
  items: Ticket[];
  total: number;
  counts: Record<TicketFilter, number>;
}

export interface TicketsQuery {
  filter: TicketFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  at: string;
}

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
  storage: { usedGb: number; totalGb: number };
  newestRequests: RegistrationRequest[];
  activity: ActivityItem[];
  healthMessage: string;
}

export interface PlatformNotification {
  id: string;
  kind: 'registration' | 'ticket';
  /** Small label, e.g. "Organisation registration". */
  label: string;
  headline: string;
  detail: string;
  at: string;
  link: string;
  read: boolean;
}

export interface PlatformShell {
  notifications: PlatformNotification[];
  unread: number;
  pendingRequests: number;
}

export type MaterialType = 'Books' | 'Videos' | 'Images' | 'Audio';
export const MATERIAL_TYPES: MaterialType[] = ['Books', 'Videos', 'Images', 'Audio'];

export interface LibraryConfig {
  libraryName: string;
  organisationRegistration: 'manual' | 'automatic';
  allowedTypes: MaterialType[];
  maxUploadMb: number;
  defaultQuotaGb: number;
  maintenanceMode: boolean;
}

export interface ConfigChange {
  id: string;
  title: string;
  publishedAt: string;
  by: string;
}

export interface LibraryConfigState {
  published: LibraryConfig;
  /** Unpublished changes saved on the server, if any. */
  draft: LibraryConfig | null;
  recentChanges: ConfigChange[];
}
