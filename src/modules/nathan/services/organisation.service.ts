import type {
  MaterialRow, MaterialsPage, MaterialsQuery, MaterialUpdate, MembersPage, MembersQuery, NewMaterial, OrganisationDashboard,
} from '../types/dashboard';
import type { InvitationCodeValidation } from '../types/invitation';
import type { OrganisationRegistrationRequest } from '../types/organisation';
import type {
  InvitationCode, InvitationCodesPage, InvitationCodesQuery, NewInvitationCode, NewRenewalRequest, NewTicket, RenewalOverview, RenewalRequest,
} from '../types/organisationAdmin';
import type { Ticket, TicketsPage, TicketsQuery } from '../types/platform';
import { request } from './http';
import { supabase } from '../../../services/supabase';

/**
 * Organisation registration: creates the account AND files the request in one step.
 * The organisation details travel as sign-up metadata; a database trigger turns them into a
 * pending organisation_requests row (see 20261117_organisation_signup_requests.sql). This works
 * whether or not email confirmation is on, because it needs no session. The account gets no
 * access until a Platform Manager approves the request.
 */
export async function submitRegistrationRequest(payload: OrganisationRegistrationRequest): Promise<void> {
  const email = payload.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      emailRedirectTo: `${window.location.origin}/organisation/login`,
      data: {
        full_name: payload.fullName.trim(),
        account_type: 'organisation',
        organisation_request: {
          organisation_name: payload.organisationName.trim(),
          type: payload.organisationType,
          country: payload.country.trim(),
          province_state: payload.provinceOrState.trim(),
          city_town: payload.cityOrTown.trim(),
          postal_code: payload.postalCode.trim(),
        },
      },
    },
  });
  if (error) throw error;
  // Supabase returns an obfuscated user with no identities when the email is already registered.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('An account with this email already exists. Log in, or use a different email address.');
  }
  // With email confirmation off, sign-up opens a session. Close it: nobody is logged in
  // (least of all as an end user) until the request has been reviewed.
  if (data.session) await supabase.auth.signOut();
}

/** POST /organisations/validate-code (public) -> { valid, organisation? } */
export function validateOrganisationCode(code: string): Promise<InvitationCodeValidation> {
  return request<InvitationCodeValidation>('/organisations/validate-code', { method: 'POST', body: { code }, silent401: true });
}

// ---- Organisation admin area ----
function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
  const out = sp.toString();
  return out ? `?${out}` : '';
}

/** GET /organisation/dashboard: overview numbers, invite link, upload limits. */
export const getDashboard = (signal?: AbortSignal) => request<OrganisationDashboard>('/organisation/dashboard', { signal });

/** GET /organisation/materials?kind=&q=&category=&sort=&page=&pageSize= */
export const listMaterials = (query: MaterialsQuery, signal?: AbortSignal) =>
  request<MaterialsPage>(`/organisation/materials${qs({ ...query })}`, { signal });

/** POST /organisation/materials (multipart/form-data: file, kind, title, author, status, categories[]) */
export function createMaterial(input: NewMaterial): Promise<MaterialRow> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('kind', input.kind);
  form.append('title', input.title);
  form.append('author', input.author);
  form.append('status', input.status);
  input.categories.forEach((c) => form.append('categories', c));
  return request<MaterialRow>('/organisation/materials', { method: 'POST', body: form });
}

/** PATCH /organisation/materials/:id */
export const updateMaterial = (id: string, patch: MaterialUpdate) =>
  request<MaterialRow>(`/organisation/materials/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });

/** DELETE /organisation/materials/:id */
export const deleteMaterial = (id: string) => request(`/organisation/materials/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** GET /organisation/categories -> string[] */
export const listCategories = (signal?: AbortSignal) => request<string[]>('/organisation/categories', { signal });

/** POST /organisation/categories {name} -> updated string[] */
export const createCategory = (name: string) => request<string[]>('/organisation/categories', { method: 'POST', body: { name } });

/** GET /organisation/members?filter=&q=&page=&pageSize= */
export const listMembers = (query: MembersQuery, signal?: AbortSignal) =>
  request<MembersPage>(`/organisation/members${qs({ ...query })}`, { signal });

/** DELETE /organisation/members/:id (removes their library access) */
export const removeMember = (id: string) => request(`/organisation/members/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** POST /organisation/invitations {emails} -> { sent } */
export const sendInvitations = (emails: string[]) =>
  request<{ sent: number }>('/organisation/invitations', { method: 'POST', body: { emails } });

/** GET /organisation/invitation-codes?status=&q=&page=&pageSize= */
export const listInvitationCodes = (query: InvitationCodesQuery, signal?: AbortSignal) =>
  request<InvitationCodesPage>(`/organisation/invitation-codes${qs({ ...query })}`, { signal });

/** POST /organisation/invitation-codes {label?, expiresInDays, maxUses|null} -> InvitationCode */
export const createInvitationCode = (input: NewInvitationCode) =>
  request<InvitationCode>('/organisation/invitation-codes', { method: 'POST', body: input });

/** POST /organisation/invitation-codes/:id/revoke -> InvitationCode */
export const revokeInvitationCode = (id: string) =>
  request<InvitationCode>(`/organisation/invitation-codes/${encodeURIComponent(id)}/revoke`, { method: 'POST' });

/** GET /organisation/renewals -> { accessEndsAt, requests } */
export const getRenewals = (signal?: AbortSignal) => request<RenewalOverview>('/organisation/renewals', { signal });

/** POST /organisation/renewals {termMonths, note?} -> RenewalRequest (409 RENEWAL_PENDING if one is already open) */
export const requestRenewal = (input: NewRenewalRequest) =>
  request<RenewalRequest>('/organisation/renewals', { method: 'POST', body: input });

/** DELETE /organisation/renewals/:id (withdraws a pending request) */
export const withdrawRenewal = (id: string) => request(`/organisation/renewals/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** GET /organisation/tickets?filter=&q=&page=&pageSize= (this organisation's tickets only) */
export const listOwnTickets = (query: TicketsQuery, signal?: AbortSignal) =>
  request<TicketsPage>(`/organisation/tickets${qs({ ...query })}`, { signal });

/** GET /organisation/tickets/:id (includes the message thread) */
export const getOwnTicket = (id: string, signal?: AbortSignal) =>
  request<Ticket>(`/organisation/tickets/${encodeURIComponent(id)}`, { signal });

/** POST /organisation/tickets {subject, priority, message} -> Ticket */
export const createTicket = (input: NewTicket) => request<Ticket>('/organisation/tickets', { method: 'POST', body: input });

/** POST /organisation/tickets/:id/reply {message} -> Ticket */
export const replyToOwnTicket = (id: string, message: string) =>
  request<Ticket>(`/organisation/tickets/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { message } });

/** POST /organisation/tickets/:id/resolve -> Ticket (the organisation closes its own ticket) */
export const closeOwnTicket = (id: string) => request<Ticket>(`/organisation/tickets/${encodeURIComponent(id)}/resolve`, { method: 'POST' });
