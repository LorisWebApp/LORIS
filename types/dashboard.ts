import type { MaterialType } from './platform';

export type MaterialKind = 'book' | 'video' | 'image' | 'audio';
export type MaterialStatus = 'published' | 'draft';

export const MATERIAL_KINDS: MaterialKind[] = ['book', 'video', 'image', 'audio'];

/** Display + validation rules per material type (upload screen and tables). */
export const MATERIAL_KIND_META: Record<MaterialKind, {
  label: string; plural: string; extensions: string[]; formats: string; dropTitle: string; platformType: MaterialType;
}> = {
  book: { label: 'Book', plural: 'Books', extensions: ['pdf', 'epub'], formats: 'PDF, EPUB', dropTitle: 'Choose a book or drag it here', platformType: 'Books' },
  video: { label: 'Video', plural: 'Videos', extensions: ['mp4', 'mov'], formats: 'MP4, MOV', dropTitle: 'Choose a video or drag it here', platformType: 'Videos' },
  image: { label: 'Image', plural: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'], formats: 'JPG, PNG, WEBP', dropTitle: 'Choose an image or drag it here', platformType: 'Images' },
  audio: { label: 'Audio', plural: 'Audio', extensions: ['mp3', 'wav'], formats: 'MP3, WAV', dropTitle: 'Choose an audio file or drag it here', platformType: 'Audio' },
};

export interface MaterialRow {
  id: string;
  title: string;
  /** Author / creator. */
  author: string;
  kind: MaterialKind;
  /** File format, e.g. PDF, MP4. */
  fileFormat: string;
  fileSizeMb: number;
  addedAt: string;
  status: MaterialStatus;
  categories: string[];
  /** 1–5, or null when nobody has rated it yet. */
  ratingAverage: number | null;
  ratingCount: number;
}

export interface MaterialsQuery {
  kind?: MaterialKind | 'all';
  q?: string;
  category?: string;
  sort?: 'recent' | 'oldest' | 'title' | 'rating';
  page?: number;
  pageSize?: number;
}

export interface MaterialsPage {
  items: MaterialRow[];
  total: number;
  /** Per-kind counts for the current search and category filter. */
  counts: Record<MaterialKind | 'all', number>;
}

export interface NewMaterial {
  kind: MaterialKind;
  title: string;
  author: string;
  categories: string[];
  status: MaterialStatus;
  file: File;
}

export type MaterialUpdate = Partial<Pick<MaterialRow, 'title' | 'author' | 'categories' | 'status'>>;

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  online: boolean;
  joinedAt: string;
}
export type MemberFilter = 'all' | 'online' | 'offline';

export interface MembersQuery { filter?: MemberFilter; q?: string; page?: number; pageSize?: number }
export interface MembersPage { items: Member[]; total: number; counts: Record<MemberFilter, number> }

export interface OrganisationDashboard {
  organisationName: string;
  inviteLink: string;
  materials: { total: number; books: number; videos: number; images: number; audio: number };
  members: { total: number; online: number; offline: number; activeLast30Days: number };
  pendingInvitations: number;
  /** Platform-wide rules for uploads, set in Platform → Library system. */
  limits: { maxUploadMb: number; allowedTypes: MaterialType[] };
}
