/**
 * Tiny in-browser API used when VITE_USE_MOCKS=true. It exists so the UI can be run and reviewed
 * without a backend; it is NOT a backend implementation. Behaviour (status codes, error codes,
 * field names) follows docs/API_CONTRACT.md so the real API can be swapped in unchanged.
 */
import { ApiError } from '../apiError';
import type { RequestOptions } from '../http';
import { UNAUTHORIZED_EVENT } from '../http';
import { MATERIAL_KIND_META, MATERIAL_KINDS, type MaterialKind, type MaterialRow, type MaterialsPage, type MemberFilter, type MembersPage, type MaterialStatus } from '../../types/dashboard';
import type {
  LibraryConfig, LibraryConfigState, OrganisationSummary, PlatformNotification, PlatformOverview, PlatformShell,
  RegistrationRequest, RequestDecision, RequestsPage, RequestStatus, Ticket, TicketFilter, TicketsPage,
} from '../../types/platform';
import type { User, UserRole } from '../../types/user';
import { activity, ago, categories, EXPIRED_CODE, invitationCodes, libraryConfig, materials, members, orgState, readNotificationIds, requests, tickets, users, type MockUser } from './mockData';

type Body = Record<string, unknown>;
interface Ctx { body: Body; params: string[]; query: URLSearchParams; user: MockUser | null }
type Handler = (ctx: Ctx) => unknown;

const routes: Array<{ method: string; pattern: RegExp; handler: Handler; auth?: 'any' | UserRole }> = [];
function route(method: string, pattern: string, handler: Handler, auth?: 'any' | UserRole) {
  routes.push({ method, pattern: new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`), handler, auth });
}

/** multipart bodies -> plain object (files become fileName / fileSizeMb; repeated keys become arrays). */
function formToBody(form: FormData): Body {
  const out: Body = {};
  form.forEach((value, key) => {
    if (typeof value !== 'string') {
      out.fileName = value.name;
      out.fileSizeMb = Math.round(value.size / 10485.76) / 100;
      return;
    }
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  });
  return out;
}
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v : v === undefined ? [] : [v]).filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim());

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const str = (b: Body, k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');
const publicUser = ({ password: _p, ...rest }: MockUser): User => { void _p; return rest; };
const userFromToken = (token: string | null) => (token?.startsWith('mock.') ? users.find((u) => u.id === token.slice(5)) ?? null : null);

export async function mockRequest<T>(path: string, options: RequestOptions, token: string | null): Promise<T> {
  await delay(180 + Math.random() * 220);
  const url = new URL(path, 'http://mock.local');
  const method = options.method ?? 'GET';

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(url.pathname);
    if (!m) continue;

    const user = userFromToken(token);
    if (r.auth) {
      if (!user) {
        if (!options.silent401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        throw new ApiError('Please log in to continue.', 401, 'UNAUTHENTICATED');
      }
      if (r.auth !== 'any' && user.role !== r.auth) throw new ApiError('You do not have access to this resource.', 403, 'FORBIDDEN');
    }
    const body = typeof FormData !== 'undefined' && options.body instanceof FormData ? formToBody(options.body) : ((options.body ?? {}) as Body);
    const result = r.handler({ body, params: m.slice(1).map(decodeURIComponent), query: url.searchParams, user });
    return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
  }
  throw new ApiError(`Mock endpoint not implemented: ${method} ${url.pathname}`, 404, 'NOT_FOUND');
}

// ======================= Auth =======================
route('POST', '/auth/login', ({ body }) => {
  const email = str(body, 'email').toLowerCase();
  const orgName = str(body, 'organisationName').toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === email);
  const orgOk = !found || found.role === 'platform_admin' || (found.organisationName ?? '').toLowerCase() === orgName;
  if (!found || found.password !== body.password || !orgOk) throw new ApiError('Incorrect organisation, email or password.', 401, 'INVALID_CREDENTIALS');
  if (!found.emailVerified) throw new ApiError('Please verify your email address first.', 403, 'EMAIL_NOT_VERIFIED');
  return { user: publicUser(found), accessToken: `mock.${found.id}` };
});
route('POST', '/auth/logout', () => undefined);
route('GET', '/auth/me', ({ user }) => ({ user: publicUser(user as MockUser) }), 'any');

route('POST', '/auth/register', ({ body }) => {
  const code = str(body, 'invitationCode');
  const org = invitationCodes[code];
  if (!org) throw new ApiError('That invitation code is not valid.', 404, 'CODE_INVALID');
  const email = str(body, 'email').toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === email)) throw new ApiError('An account with this email already exists.', 409, 'EMAIL_TAKEN', { email: 'An account with this email already exists.' });
  users.push({ id: `u-${Date.now()}`, email, fullName: str(body, 'fullName'), role: 'member', organisationId: org.id, organisationName: org.name, emailVerified: false, password: String(body.password ?? '') });
  return undefined;
});
route('POST', '/auth/forgot-password', () => undefined);
route('POST', '/auth/reset-password', ({ body }) => {
  if (str(body, 'token') !== 'demo') throw new ApiError('This reset link has expired.', 410, 'TOKEN_EXPIRED');
  return undefined;
});
route('POST', '/auth/verify-email', ({ body }) => {
  if (str(body, 'token') !== 'demo') throw new ApiError('This verification link is invalid or has expired.', 410, 'TOKEN_EXPIRED');
  users.forEach((u) => { u.emailVerified = true; });
  return undefined;
});
route('POST', '/auth/resend-verification', () => undefined);

// ======================= Organisations (public) =======================
route('POST', '/organisations/validate-code', ({ body }) => {
  const code = str(body, 'code');
  if (code.toUpperCase() === EXPIRED_CODE) throw new ApiError('This code has expired.', 410, 'CODE_EXPIRED');
  const org = invitationCodes[code.toUpperCase()];
  if (!org) throw new ApiError('Invalid code.', 404, 'CODE_INVALID');
  return { valid: true, organisation: org };
});
route('POST', '/organisations/registration-requests', ({ body }) => {
  const email = str(body, 'email').toLowerCase();
  if (requests.some((r) => r.email.toLowerCase() === email && (r.status === 'pending' || r.status === 'more_details'))) throw new ApiError('Duplicate request.', 409, 'DUPLICATE');
  const n = Math.max(...requests.map((r) => Number(r.id.slice(4)))) + 1;
  requests.unshift({ id: `req-${n}`, reference: `REQ-${String(n).padStart(4, '0')}`, organisationName: str(body, 'organisationName'), email: str(body, 'email'), organisationType: str(body, 'organisationType'), country: str(body, 'country'), provinceOrState: str(body, 'provinceOrState'), cityOrTown: str(body, 'cityOrTown'), postalCode: str(body, 'postalCode'), submittedAt: ago(0), status: 'pending' });
  return undefined;
});

// ======================= Platform admin =======================
const byNewest = <T extends { submittedAt?: string; receivedAt?: string }>(a: T, b: T) => +new Date(b.submittedAt ?? b.receivedAt ?? 0) - +new Date(a.submittedAt ?? a.receivedAt ?? 0);
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const countReq = (s: RequestStatus) => requests.filter((r) => r.status === s).length;

function notifications(): PlatformNotification[] {
  const fromRequests = requests.filter((r) => r.status === 'pending').map<PlatformNotification>((r) => ({
    id: `n-${r.id}`, kind: 'registration', label: 'Organisation registration', headline: r.organisationName,
    detail: `${r.organisationType} · ${r.cityOrTown}, ${r.country}`, at: r.submittedAt, link: `/platform/requests/${r.id}`, read: readNotificationIds.has(`n-${r.id}`),
  }));
  const fromTickets = tickets.filter((t) => t.status === 'open' && t.awaitingReply).map<PlatformNotification>((t) => ({
    id: `n-${t.id}`, kind: 'ticket', label: 'New support ticket', headline: `#${t.reference} · ${t.subject}`,
    detail: t.organisationName, at: t.receivedAt, link: `/platform/tickets?ticket=${t.id}`, read: readNotificationIds.has(`n-${t.id}`),
  }));
  return [...fromRequests, ...fromTickets].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

route('GET', '/platform/shell', (): PlatformShell => {
  const items = notifications();
  return { notifications: items, unread: items.filter((n) => !n.read).length, pendingRequests: countReq('pending') };
}, 'platform_admin');
route('POST', '/platform/notifications/read-all', () => { notifications().forEach((n) => readNotificationIds.add(n.id)); return undefined; }, 'platform_admin');

route('GET', '/platform/overview', (): PlatformOverview => {
  const total = materials.length;
  const count = (k: MaterialKind) => materials.filter((m) => m.kind === k).length;
  const open = tickets.filter((t) => t.status === 'open');
  const pending = requests.filter((r) => r.status === 'pending');
  return {
    activeUsers: 846, usersOnlineNow: 126, activeOrganisations: countReq('accepted'), organisationsOnlineNow: 8,
    pendingRequests: pending.length, requestsToday: pending.filter((r) => isToday(r.submittedAt)).length,
    openTickets: open.length, ticketsAwaitingReply: open.filter((t) => t.awaitingReply).length,
    materials: { total, books: count('book'), videos: count('video'), images: count('image'), audio: count('audio') },
    storage: { usedGb: 680, totalGb: 1000 },
    newestRequests: [...pending].sort(byNewest).slice(0, 3),
    activity, healthMessage: 'Library health is good. Backups completed today at 03:00 UTC.',
  };
}, 'platform_admin');

route('GET', '/platform/requests', ({ query }): RequestsPage => {
  const status = (query.get('status') ?? 'pending') as RequestStatus;
  const q = (query.get('q') ?? '').toLowerCase();
  const sort = query.get('sort') ?? 'newest';
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Number(query.get('pageSize') ?? 10);
  let list = requests.filter((r) => r.status === status && (!q || r.organisationName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)));
  list = [...list].sort(byNewest);
  if (sort === 'oldest') list.reverse();
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length,
    counts: { pending: countReq('pending'), more_details: countReq('more_details'), accepted: countReq('accepted'), rejected: countReq('rejected') },
  };
}, 'platform_admin');

const findRequest = (id: string): RegistrationRequest => {
  const r = requests.find((x) => x.id === id);
  if (!r) throw new ApiError('Registration request not found.', 404, 'NOT_FOUND');
  return r;
};
route('GET', '/platform/requests/:id', ({ params }) => findRequest(params[0]), 'platform_admin');
route('POST', '/platform/requests/:id/decision', ({ params, body }) => {
  const r = findRequest(params[0]);
  if (r.status === 'accepted' || r.status === 'rejected') throw new ApiError('This request has already been decided.', 409, 'ALREADY_DECIDED');
  const decision = body.decision as RequestDecision;
  if (!['accept', 'reject', 'more_details'].includes(decision)) throw new ApiError('Unknown decision.', 400, 'INVALID_DECISION');
  if (decision === 'more_details' && !str(body, 'message')) throw new ApiError('Tell the organisation what you need.', 400, 'VALIDATION', { message: 'Tell the organisation what you need.' });
  r.status = decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : 'more_details';
  r.decisionMessage = str(body, 'message') || undefined;
  return r;
}, 'platform_admin');

route('GET', '/platform/organisations', (): OrganisationSummary[] =>
  requests.filter((r) => r.status === 'accepted').sort(byNewest).map((r) => ({
    id: `org-${r.id}`, name: r.organisationName, type: r.organisationType, country: r.country, city: r.cityOrTown,
    members: 12 + ((r.organisationName.length * 7) % 180), joinedAt: r.submittedAt,
  })), 'platform_admin');

function ticketFilter(t: Ticket, f: TicketFilter) {
  return f === 'resolved' ? t.status === 'resolved' : f === 'awaiting_reply' ? t.status === 'open' && t.awaitingReply : t.status === 'open';
}
route('GET', '/platform/tickets', ({ query }): TicketsPage => {
  const filter = (query.get('filter') ?? 'open') as TicketFilter;
  const q = (query.get('q') ?? '').toLowerCase();
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Number(query.get('pageSize') ?? 5);
  const list = tickets.filter((t) => ticketFilter(t, filter) && (!q || t.subject.toLowerCase().includes(q) || t.organisationName.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q))).sort(byNewest);
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize).map((t) => ({ ...t, messages: [] })), total: list.length,
    counts: { open: tickets.filter((t) => ticketFilter(t, 'open')).length, awaiting_reply: tickets.filter((t) => ticketFilter(t, 'awaiting_reply')).length, resolved: tickets.filter((t) => ticketFilter(t, 'resolved')).length },
  };
}, 'platform_admin');

const findTicket = (id: string): Ticket => {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new ApiError('Ticket not found.', 404, 'NOT_FOUND');
  return t;
};
route('GET', '/platform/tickets/:id', ({ params }) => findTicket(params[0]), 'platform_admin');
route('POST', '/platform/tickets/:id/reply', ({ params, body }) => {
  const t = findTicket(params[0]);
  const message = str(body, 'message');
  if (!message) throw new ApiError('Write a reply first.', 400, 'VALIDATION', { message: 'Write a reply first.' });
  if (t.status === 'resolved') throw new ApiError('This ticket is resolved.', 409, 'TICKET_RESOLVED');
  t.messages.push({ id: `m-${Date.now()}`, author: 'Admin', authorType: 'admin', body: message, sentAt: ago(0) });
  t.awaitingReply = false;
  return t;
}, 'platform_admin');
route('POST', '/platform/tickets/:id/resolve', ({ params }) => {
  const t = findTicket(params[0]);
  t.status = 'resolved'; t.awaitingReply = false;
  return t;
}, 'platform_admin');

const configState = (): LibraryConfigState => ({ published: libraryConfig.published, draft: libraryConfig.draft, recentChanges: libraryConfig.recentChanges });
route('GET', '/platform/library-config', configState, 'platform_admin');
route('POST', '/platform/library-config/publish', ({ body }) => {
  const c = body as unknown as LibraryConfig;
  if (!c.libraryName?.trim()) throw new ApiError('Library name is required.', 400, 'VALIDATION', { libraryName: 'Library name is required.' });
  libraryConfig.published = { ...c };
  libraryConfig.draft = null;
  libraryConfig.recentChanges.unshift({ id: `c-${Date.now()}`, title: 'Library configuration updated', publishedAt: ago(0), by: 'Admin' });
  return configState();
}, 'platform_admin');
route('POST', '/platform/library-config/discard', () => { libraryConfig.draft = null; return configState(); }, 'platform_admin');

// ======================= Organisation admin =======================
route('GET', '/organisation/dashboard', ({ user }) => {
  const count = (k: MaterialKind) => materials.filter((m) => m.kind === k).length;
  const online = members.filter((m) => m.online).length;
  return {
    organisationName: user?.organisationName ?? 'Your organisation',
    inviteLink: 'loris.library/invite/your-organisation',
    materials: { total: materials.length, books: count('book'), videos: count('video'), images: count('image'), audio: count('audio') },
    members: { total: members.length, online, offline: members.length - online, activeLast30Days: orgState.activeLast30Days },
    pendingInvitations: orgState.pendingInvitations,
    limits: { maxUploadMb: libraryConfig.published.maxUploadMb, allowedTypes: libraryConfig.published.allowedTypes },
  };
}, 'organisation_admin');

route('GET', '/organisation/materials', ({ query }): MaterialsPage => {
  const kind = (query.get('kind') ?? 'all') as MaterialKind | 'all';
  const q = (query.get('q') ?? '').toLowerCase();
  const category = query.get('category') ?? '';
  const sort = query.get('sort') ?? 'recent';
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Number(query.get('pageSize') ?? 6);
  const base = materials.filter((m) => (!q || m.title.toLowerCase().includes(q) || m.author.toLowerCase().includes(q)) && (!category || m.categories.includes(category)));
  const list = base.filter((m) => kind === 'all' || m.kind === kind).sort((a, b) =>
    sort === 'title' ? a.title.localeCompare(b.title)
    : sort === 'oldest' ? +new Date(a.addedAt) - +new Date(b.addedAt)
    : sort === 'rating' ? (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0) || b.ratingCount - a.ratingCount
    : +new Date(b.addedAt) - +new Date(a.addedAt));
  const c = (k: MaterialKind) => base.filter((m) => m.kind === k).length;
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, counts: { all: base.length, book: c('book'), video: c('video'), image: c('image'), audio: c('audio') } };
}, 'organisation_admin');

function validateMaterialFields(body: Body, partial: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!partial || 'title' in body) if (!str(body, 'title')) errors.title = 'Enter a title.';
  if (!partial || 'categories' in body) if (asStrings(body.categories).length === 0) errors.categories = 'Choose at least one category.';
  return errors;
}
const failFields = (errors: Record<string, string>) => {
  if (Object.keys(errors).length) throw new ApiError('Please fix the highlighted fields.', 400, 'VALIDATION', errors);
};

route('POST', '/organisation/materials', ({ body }): MaterialRow => {
  const kind = str(body, 'kind') as MaterialKind;
  if (!MATERIAL_KINDS.includes(kind)) throw new ApiError('Choose a material type.', 400, 'VALIDATION', { kind: 'Choose a material type.' });
  const meta = MATERIAL_KIND_META[kind];
  if (!libraryConfig.published.allowedTypes.includes(meta.platformType)) throw new ApiError(`${meta.plural} are not enabled for this library.`, 403, 'TYPE_NOT_ALLOWED');
  const fileName = str(body, 'fileName');
  if (!fileName) throw new ApiError('Choose a file to upload.', 400, 'VALIDATION', { file: 'Choose a file to upload.' });
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!meta.extensions.includes(ext)) throw new ApiError(`${meta.plural} must be ${meta.formats}.`, 400, 'INVALID_FILE_TYPE', { file: `${meta.plural} must be ${meta.formats}.` });
  const sizeMb = Number(body.fileSizeMb ?? 0);
  if (sizeMb > libraryConfig.published.maxUploadMb) throw new ApiError(`Files can be up to ${libraryConfig.published.maxUploadMb} MB.`, 413, 'FILE_TOO_LARGE', { file: `Files can be up to ${libraryConfig.published.maxUploadMb} MB.` });
  failFields(validateMaterialFields(body, false));
  const status: MaterialStatus = str(body, 'status') === 'draft' ? 'draft' : 'published';
  const row: MaterialRow = { id: `m-new-${Date.now()}`, title: str(body, 'title'), author: str(body, 'author') || 'Unknown', kind, fileFormat: ext.toUpperCase(), fileSizeMb: sizeMb || 0.1, addedAt: ago(0), status, categories: asStrings(body.categories), ratingAverage: null, ratingCount: 0 };
  materials.unshift(row);
  return row;
}, 'organisation_admin');

const findMaterial = (id: string): MaterialRow => {
  const m = materials.find((x) => x.id === id);
  if (!m) throw new ApiError('Material not found.', 404, 'NOT_FOUND');
  return m;
};
route('PATCH', '/organisation/materials/:id', ({ params, body }) => {
  const m = findMaterial(params[0]);
  failFields(validateMaterialFields(body, true));
  if ('title' in body) m.title = str(body, 'title');
  if ('author' in body) m.author = str(body, 'author') || m.author;
  if ('categories' in body) m.categories = asStrings(body.categories);
  if (body.status === 'draft' || body.status === 'published') m.status = body.status;
  return m;
}, 'organisation_admin');
route('DELETE', '/organisation/materials/:id', ({ params }) => {
  const m = findMaterial(params[0]);
  materials.splice(materials.indexOf(m), 1);
  return undefined;
}, 'organisation_admin');

route('GET', '/organisation/categories', () => categories, 'organisation_admin');
route('POST', '/organisation/categories', ({ body }) => {
  const name = str(body, 'name');
  if (!name) throw new ApiError('Enter a category name.', 400, 'VALIDATION', { name: 'Enter a category name.' });
  if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) throw new ApiError('That category already exists.', 409, 'CATEGORY_EXISTS', { name: 'That category already exists.' });
  categories.push(name);
  return categories;
}, 'organisation_admin');

route('GET', '/organisation/members', ({ query }): MembersPage => {
  const filter = (query.get('filter') ?? 'all') as MemberFilter;
  const q = (query.get('q') ?? '').toLowerCase();
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Number(query.get('pageSize') ?? 6);
  const base = members.filter((m) => !q || m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  const list = base.filter((m) => filter === 'all' || (filter === 'online' ? m.online : !m.online));
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, counts: { all: base.length, online: base.filter((m) => m.online).length, offline: base.filter((m) => !m.online).length } };
}, 'organisation_admin');
route('DELETE', '/organisation/members/:id', ({ params }) => {
  const i = members.findIndex((m) => m.id === params[0]);
  if (i < 0) throw new ApiError('Member not found.', 404, 'NOT_FOUND');
  members.splice(i, 1);
  return undefined;
}, 'organisation_admin');

route('POST', '/organisation/invitations', ({ body }) => {
  const emails = asStrings(body.emails);
  if (!emails.length) throw new ApiError('Add at least one email address.', 400, 'VALIDATION', { emails: 'Add at least one email address.' });
  orgState.pendingInvitations += emails.length;
  return { sent: emails.length };
}, 'organisation_admin');
