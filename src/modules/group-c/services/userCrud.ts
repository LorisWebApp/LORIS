import { supabase } from '../../../services/supabase';
import type { Bookmark, Highlight, Note } from '../types/reader.types';

export const newId = (): string => crypto.randomUUID();

export function clearUserCaches(): void {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith('groupc.cache.') || key.startsWith('groupc.mock.'))
      .forEach((key) => localStorage.removeItem(key));
  } catch { /* browser storage may be unavailable */ }
}

type SupportedRecord = Bookmark | Note | Highlight;
type TableName = 'user_bookmarks' | 'user_notes' | 'user_highlights';

function tableFor(path: string): TableName {
  if (path.includes('bookmarks')) return 'user_bookmarks';
  if (path.includes('highlights')) return 'user_highlights';
  return 'user_notes';
}

function fromRow(row: Record<string, any>, table: TableName): SupportedRecord {
  const location = (row.location_data ?? {}) as Record<string, unknown>;
  const common = { id: row.id, materialId: row.material_id, materialTitle: row.material?.title ?? '', page: row.page_number ?? 1, createdAt: row.created_at };
  if (table === 'user_bookmarks') return { ...common, label: row.bookmark_name ?? '', updatedAt: row.created_at } as Bookmark;
  if (table === 'user_highlights') return { ...common, paragraph: typeof location.paragraph === 'number' ? location.paragraph : 0, start: typeof location.start === 'number' ? location.start : 0, end: typeof location.end === 'number' ? location.end : 0, text: row.highlighted_text, color: row.highlight_color ?? 'yellow' } as Highlight;
  return { ...common, text: row.note_content, quote: typeof location.quote === 'string' ? location.quote : undefined, updatedAt: row.updated_at } as Note;
}

function toRow(item: SupportedRecord, table: TableName, userId: string): Record<string, unknown> {
  const common = { id: item.id, user_id: userId, material_id: item.materialId, page_number: item.page };
  if (table === 'user_bookmarks') return { ...common, bookmark_name: (item as Bookmark).label };
  if (table === 'user_highlights') {
    const h = item as Highlight;
    return { ...common, highlighted_text: h.text, highlight_color: h.color, location_data: { paragraph: h.paragraph, start: h.start, end: h.end } };
  }
  const n = item as Note;
  return { ...common, note_title: n.materialTitle || null, note_content: n.text, location_data: { quote: n.quote ?? null } };
}

export function createCrudService<T extends SupportedRecord>({ path }: { key: string; path: string }) {
  const table = tableFor(path);
  async function currentUserId() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const id = data.session?.user.id;
    if (!id) throw new Error('Sign in to access your reading annotations.');
    return id;
  }
  return {
    async list(materialId?: string): Promise<T[]> {
      const userId = await currentUserId();
      let query = supabase.from(table).select('*, material:materials(title)').eq('user_id', userId);
      if (materialId) query = query.eq('material_id', materialId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => fromRow(row as Record<string, any>, table) as T);
    },
    async create(item: T): Promise<T> {
      const userId = await currentUserId();
      const { data, error } = await supabase.from(table).insert(toRow(item, table, userId)).select('*, material:materials(title)').single();
      if (error) throw error;
      return fromRow(data as Record<string, any>, table) as T;
    },
    async update(item: T): Promise<T> {
      const userId = await currentUserId();
      const payload = toRow(item, table, userId);
      delete payload.user_id; delete payload.material_id;
      const { data, error } = await supabase.from(table).update(payload).eq('id', item.id).eq('user_id', userId).select('*, material:materials(title)').single();
      if (error) throw error;
      return fromRow(data as Record<string, any>, table) as T;
    },
    async remove(id: string): Promise<void> {
      const userId = await currentUserId();
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
  };
}
