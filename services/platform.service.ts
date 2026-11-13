import type {
  LibraryConfig, LibraryConfigState, OrganisationSummary, PlatformOverview, PlatformShell,
  RegistrationRequest, RequestDecision, RequestsPage, RequestsQuery, Ticket, TicketsPage, TicketsQuery,
} from '../types/platform';
import { request } from './http';

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Tell the platform shell (tab badges, bell) that data changed. */
export const PLATFORM_CHANGED_EVENT = 'loris:platform-changed';
const notifyChanged = () => window.dispatchEvent(new Event(PLATFORM_CHANGED_EVENT));

export const getShell = (signal?: AbortSignal) => request<PlatformShell>('/platform/shell', { signal });
export const markAllNotificationsRead = () => request('/platform/notifications/read-all', { method: 'POST' }).then(notifyChanged);

export const getOverview = (signal?: AbortSignal) => request<PlatformOverview>('/platform/overview', { signal });

export const listRequests = (query: RequestsQuery, signal?: AbortSignal) =>
  request<RequestsPage>(`/platform/requests${qs({ ...query })}`, { signal });
export const getRequest = (id: string, signal?: AbortSignal) =>
  request<RegistrationRequest>(`/platform/requests/${encodeURIComponent(id)}`, { signal });
export async function decideRequest(id: string, decision: RequestDecision, message?: string): Promise<RegistrationRequest> {
  const updated = await request<RegistrationRequest>(`/platform/requests/${encodeURIComponent(id)}/decision`, { method: 'POST', body: { decision, message } });
  notifyChanged();
  return updated;
}

export const listOrganisations = (signal?: AbortSignal) => request<OrganisationSummary[]>('/platform/organisations', { signal });

export const listTickets = (query: TicketsQuery, signal?: AbortSignal) =>
  request<TicketsPage>(`/platform/tickets${qs({ ...query })}`, { signal });
export const getTicket = (id: string, signal?: AbortSignal) =>
  request<Ticket>(`/platform/tickets/${encodeURIComponent(id)}`, { signal });
export async function replyToTicket(id: string, message: string): Promise<Ticket> {
  const t = await request<Ticket>(`/platform/tickets/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { message } });
  notifyChanged();
  return t;
}
export async function resolveTicket(id: string): Promise<Ticket> {
  const t = await request<Ticket>(`/platform/tickets/${encodeURIComponent(id)}/resolve`, { method: 'POST' });
  notifyChanged();
  return t;
}

export const getLibraryConfig = (signal?: AbortSignal) => request<LibraryConfigState>('/platform/library-config', { signal });
export const publishLibraryConfig = (config: LibraryConfig) =>
  request<LibraryConfigState>('/platform/library-config/publish', { method: 'POST', body: config });
export const discardLibraryDraft = () => request<LibraryConfigState>('/platform/library-config/discard', { method: 'POST' });
