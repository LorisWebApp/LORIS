import type { AccessAction, OrganisationAccess, RenewalDecision, RenewalPage, RenewalStatus } from '../types/organisation';
import type {
  ActivityLog,
  LibraryConfig,
  LibraryConfigState,
  OrganisationSummary,
  Page,
  PlatformNotification,
  PlatformOverview,
  PlatformShell,
  RegistrationRequest,
  RequestDecision,
  RequestPage,
  RequestQuery,
  SystemStatus,
} from '../types/platform';
import type { Ticket, TicketFilter, TicketPage } from '../types/ticket';
import type { PlatformUserFilter, PlatformUserPage } from '../types/user';
import { apiRequest } from './api';

/** Every Platform Manager call. Endpoints are documented in documentation/. */

/* Overview and system */
export const getOverview = (signal?: AbortSignal) => apiRequest<PlatformOverview>('/platform/overview', { signal });
export const getSystemStatus = (signal?: AbortSignal) => apiRequest<SystemStatus>('/platform/system-status', { signal });

/* Notifications (header bell + Notifications page) */
export async function getShell(signal?: AbortSignal): Promise<PlatformShell> {
  const result = await apiRequest<{ items: PlatformNotification[]; unread: number }>('/platform/notifications', { signal });
  return { notifications: result.items, unread: result.unread };
}
export const markAllNotificationsRead = () => apiRequest<void>('/platform/notifications/read-all', { method: 'POST' });

/* Registration requests */
export const listRequests = (query: RequestQuery, signal?: AbortSignal) =>
  apiRequest<RequestPage>('/platform/requests', { signal, query: { ...query } });
export const getRequest = (id: string, signal?: AbortSignal) =>
  apiRequest<RegistrationRequest>(`/platform/requests/${encodeURIComponent(id)}`, { signal });
export const decideRequest = (id: string, decision: RequestDecision, message?: string) =>
  apiRequest<RegistrationRequest>(`/platform/requests/${encodeURIComponent(id)}/decision`, { method: 'POST', body: { decision, message } });

/* Organisations and access */
export const listOrganisations = (signal?: AbortSignal) => apiRequest<OrganisationSummary[]>('/platform/organisations', { signal });
export const listOrganisationAccess = (signal?: AbortSignal) => apiRequest<OrganisationAccess[]>('/platform/access', { signal });
export const changeOrganisationAccess = (id: string, action: AccessAction) =>
  apiRequest<OrganisationAccess>(`/platform/access/${encodeURIComponent(id)}`, { method: 'POST', body: { action } });

/* Renewals */
export const listPlatformRenewals = (query: { status: RenewalStatus; q: string; page: number; pageSize: number }, signal?: AbortSignal) =>
  apiRequest<RenewalPage>('/platform/renewals', { signal, query: { ...query } });
export const decideRenewal = (id: string, decision: RenewalDecision, message?: string) =>
  apiRequest<void>(`/platform/renewals/${encodeURIComponent(id)}/decision`, { method: 'POST', body: { decision, message } });

/* Users and activity */
export const listPlatformUsers = (query: { role: PlatformUserFilter; q: string; page: number; pageSize: number }, signal?: AbortSignal) =>
  apiRequest<PlatformUserPage>('/platform/users', { signal, query: { ...query } });
export const listActivityLogs = (query: { q: string; page: number; pageSize: number }, signal?: AbortSignal) =>
  apiRequest<Page<ActivityLog>>('/platform/activity-logs', { signal, query: { ...query } });

/* Support tickets */
export const listTickets = (query: { filter: TicketFilter; q: string; page: number; pageSize: number }, signal?: AbortSignal) =>
  apiRequest<TicketPage>('/platform/tickets', { signal, query: { ...query } });
export const getTicket = (id: string, signal?: AbortSignal) => apiRequest<Ticket>(`/platform/tickets/${encodeURIComponent(id)}`, { signal });
export const replyToTicket = (id: string, body: string) =>
  apiRequest<Ticket>(`/platform/tickets/${encodeURIComponent(id)}/replies`, { method: 'POST', body: { body } });
export const resolveTicket = (id: string) => apiRequest<Ticket>(`/platform/tickets/${encodeURIComponent(id)}/resolve`, { method: 'POST' });

/* Library system configuration */
export const getLibraryConfig = (signal?: AbortSignal) => apiRequest<LibraryConfigState>('/platform/library-config', { signal });
export const publishLibraryConfig = (config: LibraryConfig) =>
  apiRequest<LibraryConfigState>('/platform/library-config/publish', { method: 'POST', body: config });
export const discardLibraryDraft = () => apiRequest<LibraryConfigState>('/platform/library-config/draft', { method: 'DELETE' });
