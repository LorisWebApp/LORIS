import { BookOpen, Headphones, Image as ImageIcon, Plus, Video } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, Modal, Pagination, SearchBar, StatusBadge, TabNavigation, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Input } from '../../components/common/Input';
import { Panel } from '../../components/common/Panel';
import { Select } from '../../components/common/Select';
import { CategoryPicker } from '../../components/organisation/CategoryPicker';
import { RatingStars } from '../../components/organisation/RatingStars';
import { useAsync } from '../../hooks/useAsync';
import { deleteMaterial, listCategories, listMaterials, updateMaterial } from '../../services/organisation.service';
import { ApiError } from '../../services/http';
import { MATERIAL_KIND_META, type MaterialKind, type MaterialRow, type MaterialStatus } from '../../types/dashboard';
import { formatFileSize, formatNumber } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

const PAGE_SIZE = 6;
const KIND_ICON: Record<MaterialKind, ReactNode> = {
  book: <BookOpen size={18} aria-hidden />, video: <Video size={18} aria-hidden />, image: <ImageIcon size={18} aria-hidden />, audio: <Headphones size={18} aria-hidden />,
};
type Sort = 'recent' | 'oldest' | 'title' | 'rating';

export function ManageMaterials() {
  const location = useLocation();
  const [kind, setKind] = useState<MaterialKind | 'all'>('all');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(() => {
    const n = (location.state as { notice?: string } | null)?.notice;
    return n ? { kind: 'success', text: n } : null;
  });

  const { data, loading, error, reload } = useAsync((signal) => listMaterials({ kind, q, category, sort, page, pageSize: PAGE_SIZE }, signal), [kind, q, category, sort, page]);
  const cats = useAsync(listCategories, []);

  // Edit
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [form, setForm] = useState({ title: '', author: '', categories: [] as string[], status: 'published' as MaterialStatus });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  // Delete
  const [deleting, setDeleting] = useState<MaterialRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const openEdit = (m: MaterialRow) => { setEditing(m); setForm({ title: m.title, author: m.author, categories: m.categories, status: m.status }); setFormErrors({}); };

  async function save() {
    if (!editing) return;
    const found: FieldErrors = {};
    if (!form.title.trim()) found.title = 'Enter a title.';
    if (form.categories.length === 0) found.categories = 'Choose at least one category.';
    setFormErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const saved = await updateMaterial(editing.id, { title: form.title.trim(), author: form.author.trim(), categories: form.categories, status: form.status });
      setNotice({ kind: 'success', text: `“${saved.title}” was updated.` });
      setEditing(null); reload();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFormErrors(err.fieldErrors); else setFormErrors({ title: getErrorMessage(err) });
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deleteMaterial(deleting.id);
      setNotice({ kind: 'success', text: `“${deleting.title}” was deleted.` });
      setDeleting(null);
      if (data && data.items.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); setDeleting(null); } finally { setRemoving(false); }
  }

  const columns: DataTableColumn<MaterialRow>[] = [
    { key: 'title', header: 'Material', cell: (m) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-mint text-ink">{KIND_ICON[m.kind]}</span>
        <div className="min-w-0"><p className="truncate font-medium text-deep">{m.title}</p><p className="truncate text-[13px] text-muted">{m.author} • {MATERIAL_KIND_META[m.kind].label} • {m.fileFormat} • {formatFileSize(m.fileSizeMb)}</p></div>
      </div>) },
    { key: 'categories', header: 'Category', cell: (m) => m.categories.join(', ') },
    { key: 'rating', header: 'Community rating', cell: (m) => <RatingStars average={m.ratingAverage} count={m.ratingCount} /> },
    { key: 'status', header: 'Status', cell: (m) => <StatusBadge size="sm" label={m.status === 'published' ? 'Published' : 'Draft'} variant={m.status === 'published' ? 'success' : 'accent'} /> },
    { key: 'actions', header: 'Actions', cell: (m) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => openEdit(m)} aria-label={`Edit ${m.title}`}>Edit</Button>
        <Button variant="outlineDanger" size="sm" onClick={() => setDeleting(m)} aria-label={`Delete ${m.title}`}>Delete</Button>
      </div>) },
  ];

  const filtered = Boolean(q || category);
  const from = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(page * PAGE_SIZE, data.total) : 0;
  const reset = () => setPage(1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[34px] font-medium leading-tight text-deep">Manage materials</h2>
          <p className="text-[15px] text-muted">{data ? (filtered ? `${formatNumber(data.counts.all)} matching materials` : `${formatNumber(data.counts.all)} materials across your organisation's library`) : ' '}</p>
        </div>
        <Button to="/organisation/upload" leftIcon={<Plus size={16} aria-hidden />}>Upload materials</Button>
      </div>

      {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

      <TabNavigation aria-label="Filter materials by format" variant="pill" activeId={kind} onChange={(id) => { setKind(id as MaterialKind | 'all'); reset(); }}
        tabs={[
          { id: 'all', label: 'All materials', count: data?.counts.all }, { id: 'book', label: 'Books', count: data?.counts.book }, { id: 'video', label: 'Videos', count: data?.counts.video },
          { id: 'image', label: 'Images', count: data?.counts.image }, { id: 'audio', label: 'Audio', count: data?.counts.audio },
        ]} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar appearance="raised" placeholder="Search by title or filename" onSearch={(v) => { setQ(v.trim()); reset(); }} debounceMs={300} className="w-full border border-line sm:w-80" />
        <Select label="Category" hideLabel placeholder="All categories" options={cats.data ?? []} value={category} onChange={(e) => { setCategory(e.target.value); reset(); }} className="w-full sm:w-52" />
        <Select label="Sort" hideLabel placeholder={null} value={sort} onChange={(e) => { setSort(e.target.value as Sort); reset(); }} className="w-full sm:ml-auto sm:w-60"
          options={[{ value: 'recent', label: 'Sort: Recently added' }, { value: 'oldest', label: 'Sort: Oldest first' }, { value: 'title', label: 'Sort: Title (A–Z)' }, { value: 'rating', label: 'Sort: Highest rated' }]} />
      </div>

      <Panel className="px-5 pb-4 pt-2">
        <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading materials…">
          {(d) => (
            <>
              <DataTable caption="Materials" columns={columns} rows={d.items} loading={loading} getRowKey={(m) => m.id}
                emptyState={<EmptyState title="No materials found" description={filtered ? 'Try a different search or category.' : 'Nothing has been uploaded in this format yet.'} />} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                <p>Showing {from}–{to} of {formatNumber(d.total)} materials</p>
                <Pagination page={page} totalItems={d.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </div>
            </>
          )}
        </AsyncView>
      </Panel>
      <p className="text-[14px] text-muted">Ratings use a 1–5 star scale. The count shows how many people rated each material.</p>

      <Modal open={editing !== null} onClose={() => !saving && setEditing(null)} dismissible={!saving} title="Edit material" description={editing ? `${MATERIAL_KIND_META[editing.kind].label} · ${editing.fileFormat} · ${formatFileSize(editing.fileSizeMb)}` : undefined}
        actions={<><Button variant="text" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button><Button loading={saving} onClick={save}>Save changes</Button></>}>
        <div className="space-y-4">
          <Input label="Material title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={formErrors.title} disabled={saving} />
          <Input label="Author / creator" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} disabled={saving} />
          <CategoryPicker options={cats.data ?? []} value={form.categories} onChange={(v) => setForm((f) => ({ ...f, categories: v }))} error={formErrors.categories} disabled={saving} />
          <Select label="Status" placeholder={null} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MaterialStatus }))} disabled={saving} options={[{ value: 'published', label: 'Published: visible to members' }, { value: 'draft', label: 'Draft: private until ready' }]} />
        </div>
      </Modal>

      <ConfirmationDialog open={deleting !== null} tone="danger" title="Delete this material?" description={deleting ? `“${deleting.title}” will be removed from your library for everyone. This can't be undone.` : ''} confirmLabel="Delete material" loading={removing} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
