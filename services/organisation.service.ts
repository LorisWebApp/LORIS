import type {
  MaterialRow, MaterialsPage, MaterialsQuery, MaterialUpdate, MembersPage, MembersQuery, NewMaterial, OrganisationDashboard,
} from '../types/dashboard';
import type { InvitationCodeValidation } from '../types/invitation';
import type { OrganisationRegistrationRequest } from '../types/organisation';
import { request } from './http';

/** POST /organisations/registration-requests (public) */
export function submitRegistrationRequest(payload: OrganisationRegistrationRequest): Promise<void> {
  return request('/organisations/registration-requests', { method: 'POST', body: payload, silent401: true });
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
