/**
 * In-memory seed data for the mock server (VITE_USE_MOCKS=true). Demo only:
 * resets on page reload. Shapes mirror docs/API_CONTRACT.md.
 */
import type { MaterialKind, MaterialRow, Member } from '../../types/dashboard';
import type {
  ConfigChange, LibraryConfig, RegistrationRequest, RequestStatus, Ticket, TicketMessage,
} from '../../types/platform';
import type { User } from '../../types/user';

export const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const H = 60;
const D = 24 * 60;

// ---------- Users ----------
export interface MockUser extends User { password: string }

export const users: MockUser[] = [
  { id: 'u-admin', email: 'admin@loris.test', fullName: 'Admin', role: 'platform_admin', organisationId: null, organisationName: null, emailVerified: true, password: 'Password1' },
  { id: 'u-atla', email: 'atla@loris.test', fullName: 'Atla Admin', role: 'organisation_admin', organisationId: 'org-atla', organisationName: 'Atla Learning Centre', emailVerified: true, password: 'Password1' },
  { id: 'u-reader', email: 'reader@loris.test', fullName: 'Rae Reader', role: 'member', organisationId: 'org-atla', organisationName: 'Atla Learning Centre', emailVerified: true, password: 'Password1' },
];

export const invitationCodes: Record<string, { id: string; name: string }> = {
  'ATLA-2026': { id: 'org-atla', name: 'Atla Learning Centre' },
};
export const EXPIRED_CODE = 'EXPIRED-2025';

// ---------- Registration requests ----------
function req(n: number, f: Partial<RegistrationRequest> & Pick<RegistrationRequest, 'organisationName' | 'email' | 'organisationType' | 'country' | 'provinceOrState' | 'cityOrTown' | 'postalCode'>, minutesAgo: number, status: RequestStatus): RegistrationRequest {
  return { id: `req-${n}`, reference: `REQ-${String(n).padStart(4, '0')}`, submittedAt: ago(minutesAgo), status, ...f };
}

export const requests: RegistrationRequest[] = [
  req(52, { organisationName: 'Willow Community Library', email: 'hello@willowlibrary.org', organisationType: 'Non-profit', country: 'South Africa', provinceOrState: 'Gauteng', cityOrTown: 'Johannesburg', postalCode: '2001', submittedBy: 'Lerato Mokoena · Library director' }, 24, 'pending'),
  req(51, { organisationName: 'Northbridge College', email: 'library@northbridge.ca', organisationType: 'Education', country: 'Canada', provinceOrState: 'Ontario', cityOrTown: 'Toronto', postalCode: 'M5V 2T6', submittedBy: 'Daniel Wright · Head librarian' }, 4 * H, 'pending'),
  req(50, { organisationName: 'Open Door Foundation', email: 'info@opendoor.or.ke', organisationType: 'Non-profit', country: 'Kenya', provinceOrState: 'Nairobi County', cityOrTown: 'Nairobi', postalCode: '00100', submittedBy: 'Wanjiru Kamau · Programme lead' }, 27 * H, 'pending'),
  req(49, { organisationName: 'Riverbend School', email: 'admin@riverbend.edu.au', organisationType: 'Education', country: 'Australia', provinceOrState: 'Victoria', cityOrTown: 'Melbourne', postalCode: '3000', submittedBy: 'Chloe Nguyen · Principal' }, 30 * H, 'pending'),
  req(48, { organisationName: 'Harbour Learning Hub', email: 'team@harbour.hk', organisationType: 'Community', country: 'Hong Kong', provinceOrState: '—', cityOrTown: 'Kowloon', postalCode: 'Not applicable', submittedBy: 'Marcus Lee · Coordinator' }, 52 * H, 'pending'),
  req(47, { organisationName: 'Pine Ridge Academy', email: 'office@pineridge.edu', organisationType: 'Education', country: 'United States', provinceOrState: 'Oregon', cityOrTown: 'Bend', postalCode: '97701', decisionMessage: 'Please confirm your registered charity or school number.' }, 80 * H, 'more_details'),
  req(46, { organisationName: 'Bayside Reading Circle', email: 'hello@baysidereading.nz', organisationType: 'Community', country: 'New Zealand', provinceOrState: 'Wellington', cityOrTown: 'Wellington', postalCode: '6011', decisionMessage: 'Could you share a contact phone number?' }, 90 * H, 'more_details'),
];

const w1 = ['Cedar', 'Maple', 'Lakeside', 'Hillcrest', 'Sunrise', 'Bluebird', 'Oakfield'];
const w2 = ['Library', 'Academy', 'College', 'Learning Centre', 'Community Hub', 'Reading Room'];
const places: Array<[string, string, string, string, string]> = [
  ['United Kingdom', 'England', 'Leeds', 'LS1 4AP', 'Education'],
  ['Zambia', 'Lusaka Province', 'Lusaka', '10101', 'Non-profit'],
  ['India', 'Karnataka', 'Bengaluru', '560001', 'Education'],
  ['Brazil', 'São Paulo', 'Campinas', '13010-000', 'Community'],
  ['Ghana', 'Greater Accra', 'Accra', 'GA-001', 'Non-profit'],
  ['Germany', 'Bavaria', 'Munich', '80331', 'Education'],
];
for (let i = 0; i < 42; i++) {
  const [country, province, city, postal, type] = places[i % places.length];
  const name = `${w1[i % w1.length]} ${w2[i % w2.length]}`;
  requests.push(req(i + 1, { organisationName: name, email: `contact@${name.toLowerCase().replace(/\s+/g, '')}.org`, organisationType: type, country, provinceOrState: province, cityOrTown: city, postalCode: postal }, (100 + i * 12) * H, 'accepted'));
}
for (let i = 0; i < 3; i++) {
  requests.push(req(43 + i + 100, { organisationName: `Declined Applicant ${i + 1}`, email: `apply${i + 1}@example.org`, organisationType: 'Other', country: 'Unknown', provinceOrState: '—', cityOrTown: '—', postalCode: '—', decisionMessage: 'We could not verify the organisation.' }, (400 + i * 20) * H, 'rejected'));
}

// ---------- Support tickets ----------
function msg(id: string, author: string, authorType: TicketMessage['authorType'], body: string, minutesAgo: number, attachment?: TicketMessage['attachment']): TicketMessage {
  return { id, author, authorType, body, sentAt: ago(minutesAgo), attachment };
}

export const tickets: Ticket[] = [
  { id: 't-1042', reference: 'SUP-1042', subject: 'Video upload failed', organisationName: 'Atla Learning Centre', contactEmail: 'admin@atla.org', priority: 'high', assignee: 'System admin', receivedAt: ago(10), status: 'open', awaitingReply: true,
    messages: [msg('m-1042-1', 'Nandi Jacobs', 'organisation', 'Our MP4 video upload reaches 90% and then fails. The file is 84 MB, and we have tried twice this morning. Could you help us publish it?', 10, { name: 'upload-error.png', sizeKb: 124 })] },
  { id: 't-1041', reference: 'SUP-1041', subject: 'Reset organisation access', organisationName: 'Willow Learning Trust', contactEmail: 'office@willowtrust.org', priority: 'normal', assignee: 'System admin', receivedAt: ago(42), status: 'open', awaitingReply: true,
    messages: [msg('m-1041-1', 'Peter Naidoo', 'organisation', 'Our organisation administrator has left. Please reset access so a new administrator can sign in.', 42)] },
  { id: 't-1040', reference: 'SUP-1040', subject: 'Audio stops during playback', organisationName: 'Northbridge School', contactEmail: 'it@northbridge.school', priority: 'normal', assignee: 'System admin', receivedAt: ago(60), status: 'open', awaitingReply: true,
    messages: [msg('m-1040-1', 'Sam Okafor', 'organisation', 'Audiobooks stop after about ten minutes on school tablets. Other materials play fine.', 60)] },
  { id: 't-1039', reference: 'SUP-1039', subject: 'Unable to invite a member', organisationName: 'Open Pages Library', contactEmail: 'help@openpages.org', priority: 'normal', assignee: 'System admin', receivedAt: ago(120), status: 'open', awaitingReply: false,
    messages: [
      msg('m-1039-1', 'Grace Mwila', 'organisation', 'The invitation email never arrives for one of our volunteers.', 125),
      msg('m-1039-2', 'Admin', 'admin', 'Thanks Grace. Could you confirm the email address you used?', 120),
    ] },
];
const subjects = ['Cannot reset my password', 'Storage quota reached', 'Image thumbnails missing', 'Question about member roles', 'Download link expired', 'Search results look wrong', 'Need to change organisation name', 'Upload stuck at 0%'];
const orgs = ['Lakeside College', 'Cedar Hub', 'Maple Academy', 'Hillcrest Library', 'Sunrise School'];
for (let i = 0; i < 8; i++) {
  const n = 1038 - i;
  tickets.push({ id: `t-${n}`, reference: `SUP-${n}`, subject: subjects[i], organisationName: orgs[i % orgs.length], contactEmail: `help@${orgs[i % orgs.length].toLowerCase().replace(/\s+/g, '')}.org`, priority: i % 4 === 0 ? 'high' : i % 3 === 0 ? 'low' : 'normal', assignee: 'System admin', receivedAt: ago((4 + i * 5) * H), status: 'open', awaitingReply: false,
    messages: [msg(`m-${n}-1`, 'Organisation contact', 'organisation', `Hello, we need help with: ${subjects[i].toLowerCase()}.`, (4 + i * 5) * H), msg(`m-${n}-2`, 'Admin', 'admin', 'Thanks, we are looking into this and will update you shortly.', (4 + i * 5) * H - 30)] });
}
for (let i = 0; i < 24; i++) {
  const n = 1030 - i;
  tickets.push({ id: `t-${n}`, reference: `SUP-${n}`, subject: subjects[i % subjects.length], organisationName: orgs[i % orgs.length], contactEmail: `help@${orgs[i % orgs.length].toLowerCase().replace(/\s+/g, '')}.org`, priority: 'normal', assignee: 'System admin', receivedAt: ago((60 + i * 9) * H), status: 'resolved', awaitingReply: false,
    messages: [msg(`m-${n}-1`, 'Organisation contact', 'organisation', `We had an issue: ${subjects[i % subjects.length].toLowerCase()}.`, (60 + i * 9) * H), msg(`m-${n}-2`, 'Admin', 'admin', 'This is now resolved. Please reply if it happens again.', (60 + i * 9) * H - 120)] });
}

// ---------- Platform activity / notifications ----------
export const readNotificationIds = new Set<string>();
export const activity = [
  { id: 'a1', title: 'New support ticket', detail: '#SUP-1042 · Video upload failed', at: ago(10) },
  { id: 'a2', title: 'Organisation request', detail: 'Willow Community Library', at: ago(24) },
  { id: 'a3', title: 'System update published', detail: 'Audio streaming improvements', at: ago(2 * H) },
];

// ---------- Library configuration ----------
export const libraryConfig: { published: LibraryConfig; draft: LibraryConfig | null; recentChanges: ConfigChange[] } = {
  published: { libraryName: 'Loris Web Library', organisationRegistration: 'manual', allowedTypes: ['Books', 'Videos', 'Images', 'Audio'], maxUploadMb: 50, defaultQuotaGb: 10, maintenanceMode: false },
  draft: { libraryName: 'Loris Web Library', organisationRegistration: 'manual', allowedTypes: ['Books', 'Videos', 'Images', 'Audio'], maxUploadMb: 100, defaultQuotaGb: 20, maintenanceMode: false },
  recentChanges: [
    { id: 'c1', title: 'Audio streaming improvements', publishedAt: ago(5 * H), by: 'Admin' },
    { id: 'c2', title: 'Organisation approval enabled', publishedAt: new Date('2026-11-10T09:00:00Z').toISOString(), by: 'Admin' },
  ],
};

// ---------- Organisation area (Atla Learning Centre) ----------
export const categories: string[] = ['Personal growth', 'Mindfulness', 'Design & creativity', 'Science & nature', 'Cities & culture'];
export const orgState = { pendingInvitations: 24, activeLast30Days: 846 };

const KIND_META: Record<MaterialKind, { total: number; formats: string[]; titles: string[]; by: string[]; sizes: [number, number] }> = {
  book: { total: 562, formats: ['PDF', 'EPUB'], titles: ['Quiet Mathematics', 'A History of Rivers', 'The Reader’s Garden', 'Letters on Learning', 'Maps of Memory'], by: ['Marcus Reed', 'Elena Rivers', 'Haruko Reed', 'Tomás Rey'], sizes: [2, 14] },
  video: { total: 128, formats: ['MP4', 'MOV'], titles: ['How Libraries Began', 'Studio Sessions', 'The Weather Lab', 'Walking Tours'], by: ['Atlas Studio', 'Priya Shah', 'Noah Bell'], sizes: [40, 95] },
  image: { total: 446, formats: ['JPG', 'PNG', 'WEBP'], titles: ['City Skylines', 'Field Notes', 'Garden Plates', 'Coastal Light'], by: ['The Atlas Collection', 'Visual Archive', 'Studio Wren'], sizes: [4, 22] },
  audio: { total: 148, formats: ['MP3', 'WAV'], titles: ['Stories Before Sleep', 'Night Radio', 'Voices of the Coast', 'Morning Pages'], by: ['Sofia Larsen', 'Idris Cole', 'Mei Tan'], sizes: [12, 48] },
};

function buildMaterials(): MaterialRow[] {
  const explicit: MaterialRow[] = [
    { id: 'm-1', title: 'The Art of Paying Attention', author: 'Elena Rivers', kind: 'book', fileFormat: 'PDF', fileSizeMb: 8.4, addedAt: ago(3 * H), status: 'published', categories: ['Personal growth'], ratingAverage: 4.8, ratingCount: 124 },
    { id: 'm-2', title: 'Cities for Tomorrow', author: 'Atlas Studio', kind: 'video', fileFormat: 'MP4', fileSizeMb: 84.2, addedAt: ago(2 * D + 3 * H), status: 'published', categories: ['Cities & culture'], ratingAverage: 4.6, ratingCount: 88 },
    { id: 'm-3', title: 'Botanical Forms', author: 'The Atlas Collection', kind: 'image', fileFormat: 'JPG', fileSizeMb: 12.6, addedAt: ago(3 * D + 5 * H), status: 'published', categories: ['Science & nature'], ratingAverage: 4.9, ratingCount: 56 },
    { id: 'm-4', title: 'The Living Forest', author: 'Sofia Larsen', kind: 'audio', fileFormat: 'MP3', fileSizeMb: 32.8, addedAt: ago(5 * D + 2 * H), status: 'published', categories: ['Science & nature'], ratingAverage: 4.7, ratingCount: 72 },
    { id: 'm-5', title: 'A Field Guide to Good Design', author: 'Marcus Reed', kind: 'book', fileFormat: 'PDF', fileSizeMb: 6.2, addedAt: ago(7 * D), status: 'draft', categories: ['Design & creativity'], ratingAverage: null, ratingCount: 0 },
    { id: 'm-6', title: 'Patterns of the Natural World', author: 'Visual Archive', kind: 'image', fileFormat: 'PNG', fileSizeMb: 19.5, addedAt: ago(8 * D), status: 'published', categories: ['Science & nature'], ratingAverage: 4.5, ratingCount: 41 },
  ];
  const used: Record<MaterialKind, number> = { book: 2, video: 1, image: 2, audio: 1 };
  const out = [...explicit];
  const span = 400 * D;
  (Object.keys(KIND_META) as MaterialKind[]).forEach((kind) => {
    const meta = KIND_META[kind];
    const remaining = meta.total - used[kind];
    const [lo, hi] = meta.sizes;
    for (let k = 0; k < remaining; k++) {
      const draft = k % 17 === 5;
      const unrated = draft || k % 11 === 0;
      const cats = [categories[(k * 3) % categories.length]];
      if (k % 4 === 0) cats.push(categories[(k * 3 + 1) % categories.length]);
      out.push({
        id: `m-${kind}-${k}`,
        title: k < meta.titles.length ? `${meta.titles[k]} (vol. ${k + 1})` : `${meta.titles[k % meta.titles.length]}, part ${k + 1}`,
        author: meta.by[k % meta.by.length],
        kind, fileFormat: meta.formats[k % meta.formats.length],
        fileSizeMb: Math.round((lo + ((k * 13) % (hi - lo))) * 10) / 10 + 0.1,
        addedAt: ago(10 * D + (k * span) / remaining),
        status: draft ? 'draft' : 'published', categories: cats,
        ratingAverage: unrated ? null : Math.round((4 + ((k * 7) % 10) / 10) * 10) / 10,
        ratingCount: unrated ? 0 : 3 + ((k * 13) % 140),
      });
    }
  });
  return out.sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt));
}
export const materials: MaterialRow[] = buildMaterials();

// ---------- Members (1,048 total, 128 online) ----------
const firstNames = ['Amara', 'Daniel', 'Priya', 'Noah', 'Fatima', 'Lucas', 'Sofia', 'Idris', 'Mei', 'Tomás', 'Grace', 'Peter', 'Wanjiru', 'Chloe', 'Marcus', 'Nandi', 'Sam', 'Elena', 'Haruko', 'Omar'];
const lastNames = ['Okafor', 'Kim', 'Shah', 'Williams', 'Hassan', 'Chen', 'Larsen', 'Cole', 'Tan', 'Rey', 'Mwila', 'Naidoo', 'Kamau', 'Nguyen', 'Lee', 'Jacobs', 'Bell', 'Rivers', 'Reed', 'Ali'];

function buildMembers(): Member[] {
  const explicit: Member[] = [
    { id: 'mem-1', fullName: 'Amara Okafor', email: 'amara.okafor@example.com', role: 'Member', online: true, joinedAt: ago(1 * D) },
    { id: 'mem-2', fullName: 'Daniel Kim', email: 'daniel.kim@example.com', role: 'Member', online: true, joinedAt: ago(3 * D) },
    { id: 'mem-3', fullName: 'Priya Shah', email: 'priya.shah@example.com', role: 'Member', online: false, joinedAt: ago(5 * D) },
    { id: 'mem-4', fullName: 'Noah Williams', email: 'noah.w@example.com', role: 'Member', online: false, joinedAt: ago(9 * D) },
    { id: 'mem-5', fullName: 'Fatima Hassan', email: 'fatima.h@example.com', role: 'Member', online: false, joinedAt: ago(11 * D) },
    { id: 'mem-6', fullName: 'Lucas Chen', email: 'lucas.chen@example.com', role: 'Member', online: false, joinedAt: ago(16 * D) },
  ];
  const out = [...explicit];
  let online = 2;
  for (let k = 0; out.length < 1048; k++) {
    const first = firstNames[k % firstNames.length];
    const last = lastNames[(k * 7 + Math.floor(k / 20)) % lastNames.length];
    const isOnline = online < 128 && (k * 7) % 8 === 0;
    if (isOnline) online++;
    out.push({ id: `mem-g${k}`, fullName: `${first} ${last}`, email: `${first}.${last}${k + 1}@example.com`.toLowerCase(), role: 'Member', online: isOnline, joinedAt: ago(20 * D + k * 9 * H) });
  }
  return out;
}
export const members: Member[] = buildMembers();
