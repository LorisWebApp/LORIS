import { BookOpen, FileText, Headphones, Image as ImageIcon, Plus, Upload, Video } from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Modal } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Input } from '../../components/common/Input';
import { Panel } from '../../components/common/Panel';
import { CategoryPicker } from '../../components/organisation/CategoryPicker';
import { cx } from '../../components/shared/utils/cx';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { createCategory, createMaterial, getDashboard, listCategories } from '../../services/organisation.service';
import { ApiError } from '../../services/http';
import { MATERIAL_KINDS, MATERIAL_KIND_META, type MaterialKind, type MaterialStatus } from '../../types/dashboard';
import { bytesToMb, shortOrgName } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

const KIND_ICON: Record<MaterialKind, ReactNode> = {
  book: <BookOpen size={16} aria-hidden />, video: <Video size={16} aria-hidden />, image: <ImageIcon size={16} aria-hidden />, audio: <Headphones size={16} aria-hidden />,
};

function checkFile(file: File, kind: MaterialKind, maxMb: number): string | null {
  const meta = MATERIAL_KIND_META[kind];
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!meta.extensions.includes(ext)) return `${meta.plural} must be ${meta.formats}.`;
  if (file.size > maxMb * 1024 * 1024) return `Files can be up to ${maxMb} MB. This one is ${bytesToMb(file.size).toFixed(1)} MB.`;
  return null;
}

export function UploadMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dash = useAsync(getDashboard, []);
  const cats = useAsync(listCategories, []);

  const [kind, setKind] = useState<MaterialKind>('book');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<MaterialStatus | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const [newCat, setNewCat] = useState<{ open: boolean; name: string; error: string | null; busy: boolean }>({ open: false, name: '', error: null, busy: false });

  const clearError = (key: string) => setErrors((e) => ({ ...e, [key]: '' }));
  const toggleCategory = (c: string) => { setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c])); clearError('categories'); };

  function chooseKind(next: MaterialKind) {
    setKind(next);
    clearError('file');
    if (file && checkFile(file, next, dash.data?.limits.maxUploadMb ?? 100)) setFile(null);
  }

  function pick(files: FileList | null | undefined) {
    const f = files?.[0];
    if (!f) return;
    const problem = checkFile(f, kind, dash.data?.limits.maxUploadMb ?? 100);
    if (problem) { setFile(null); setErrors((e) => ({ ...e, file: problem })); return; }
    setFile(f); clearError('file');
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer?.files); };

  async function submit(status: MaterialStatus) {
    const found: FieldErrors = {};
    if (!file) found.file = 'Choose a file to upload.';
    if (!title.trim()) found.title = 'Enter a title.';
    if (selected.length === 0) found.categories = 'Choose at least one category.';
    setErrors(found); setFormError(null);
    if (Object.keys(found).length || !file) return;

    setBusy(status);
    try {
      const saved = await createMaterial({ kind, title: title.trim(), author: author.trim(), categories: selected, status, file });
      navigate('/organisation/materials', { state: { notice: `“${saved.title}” was ${status === 'published' ? 'published' : 'saved as a draft'}.` } });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(getErrorMessage(err));
    } finally { setBusy(null); }
  }

  async function addCategory() {
    const name = newCat.name.trim();
    if (!name) return setNewCat((c) => ({ ...c, error: 'Enter a category name.' }));
    setNewCat((c) => ({ ...c, busy: true, error: null }));
    try {
      const updated = await createCategory(name);
      cats.setData(updated);
      const created = updated.find((c) => c.toLowerCase() === name.toLowerCase()) ?? name;
      setSelected((s) => (s.includes(created) ? s : [...s, created]));
      setNewCat({ open: false, name: '', error: null, busy: false });
    } catch (err) { setNewCat((c) => ({ ...c, busy: false, error: getErrorMessage(err) })); }
  }

  const org = shortOrgName(user?.organisationName);
  const locked = busy !== null;

  return (
    <AsyncView data={dash.data} loading={dash.loading} error={dash.error} onRetry={dash.reload} loadingLabel="Loading…">
      {(d) => {
        const meta = MATERIAL_KIND_META[kind];
        const allowed = (k: MaterialKind) => d.limits.allowedTypes.includes(MATERIAL_KIND_META[k].platformType);
        return (
          <div className="space-y-6">
            <section aria-labelledby="step1">
              <h2 id="step1" className="text-[26px] font-medium text-deep">1. Choose a material type</h2>
              <div role="radiogroup" aria-labelledby="step1" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {MATERIAL_KINDS.map((k) => {
                  const on = k === kind; const ok = allowed(k);
                  return (
                    <button key={k} type="button" role="radio" aria-checked={on} disabled={!ok || locked} onClick={() => chooseKind(k)}
                      className={cx('rounded-lg border bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60', on ? 'border-brand bg-mint-soft ring-1 ring-brand' : 'border-line hover:border-ink/40')}>
                      <span className="flex items-center justify-between gap-2 text-[16px] font-semibold text-deep">
                        <span className="flex items-center gap-2">{KIND_ICON[k]}{MATERIAL_KIND_META[k].plural}</span>
                        {on && <span className="text-[12px] font-semibold text-brand-text">Selected</span>}
                        {!ok && <span className="text-[12px] font-semibold text-rose-text">Not enabled</span>}
                      </span>
                      <span className="mt-1 block text-[13px] text-muted">{MATERIAL_KIND_META[k].formats}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[1.9fr_1fr]">
              <Panel className="p-6">
                {formError && <Alert className="mb-5" severity="error" onDismiss={() => setFormError(null)}>{formError}</Alert>}

                <h2 className="text-[26px] font-medium text-deep">2. Add your file</h2>
                <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
                  className={cx('mt-3 flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center', dragging ? 'border-brand bg-mint-soft' : errors.file ? 'border-rose-text' : 'border-ink/30 bg-mint-soft/60')}>
                  <Upload size={20} aria-hidden className="text-ink" />
                  <p className="mt-2 text-[17px] font-semibold text-deep">
                    <button type="button" disabled={locked} onClick={() => input.current?.click()} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{meta.dropTitle}</button>
                  </p>
                  <p className="mt-1 text-[13px] text-muted">{meta.formats.replace(', ', ' or ')} · Up to {d.limits.maxUploadMb} MB per file</p>
                  <input ref={input} type="file" className="sr-only" aria-label={`Choose a ${meta.label.toLowerCase()} file`} accept={meta.extensions.map((x) => `.${x}`).join(',')} onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
                </div>
                {errors.file && <p role="alert" className="mt-1 text-[14px] text-rose-text">{errors.file}</p>}

                {file && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-line px-4 py-3">
                    <FileText size={18} aria-hidden className="shrink-0 text-ink" />
                    <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium text-deep">{file.name}</p><p className="text-[13px] text-muted">{bytesToMb(file.size).toFixed(1)} MB · Ready to upload</p></div>
                    <Button variant="text" size="sm" disabled={locked} onClick={() => setFile(null)} aria-label={`Remove ${file.name}`}>Remove</Button>
                  </div>
                )}

                <h2 className="mt-8 text-[26px] font-medium text-deep">3. Add details &amp; categories</h2>
                <div className="mt-3 space-y-4">
                  <Input label="Material title *" value={title} onChange={(e) => { setTitle(e.target.value); clearError('title'); }} error={errors.title} disabled={locked} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Author / creator" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={locked} />
                    <CategoryPicker options={cats.data ?? []} value={selected} onChange={(v) => { setSelected(v); clearError('categories'); }} error={errors.categories} disabled={locked} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <Button variant="outline" onClick={() => submit('draft')} loading={busy === 'draft'} disabled={locked}>Save draft</Button>
                  <Button onClick={() => submit('published')} loading={busy === 'published'} disabled={locked}>Publish material</Button>
                </div>
              </Panel>

              <div className="space-y-4">
                <Panel className="bg-mint-soft p-6">
                  <h2 className="text-[24px] font-medium leading-tight text-deep">A little organisation goes a long way</h2>
                  <p className="mt-2 text-[15px] text-ink/80">Choose a type first, then add a title and one or more categories for your material.</p>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Your categories</p>
                  <ul className="m-0 mt-2 list-none divide-y divide-line p-0">
                    {(cats.data ?? []).map((c) => (
                      <li key={c}>
                        <button type="button" disabled={locked} onClick={() => toggleCategory(c)} aria-pressed={selected.includes(c)}
                          className={cx('flex w-full items-center justify-between py-2 text-left text-[15px] focus-visible:outline-2 focus-visible:outline-brand', selected.includes(c) ? 'font-semibold text-deep' : 'text-ink/80 hover:text-deep')}>
                          {c}{selected.includes(c) && <span aria-hidden className="text-brand-text">✓</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4"><Button variant="outline" size="sm" leftIcon={<Plus size={14} aria-hidden />} disabled={locked} onClick={() => setNewCat({ open: true, name: '', error: null, busy: false })}>Create category</Button></div>
                </Panel>
                <Panel className="p-6">
                  <h2 className="text-[22px] font-medium text-deep">Made for your community</h2>
                  <p className="mt-2 text-[15px] text-ink/80">Published materials are visible to all members of {org}'s library. Drafts stay private until you are ready.</p>
                </Panel>
              </div>
            </div>

            <Modal open={newCat.open} onClose={() => !newCat.busy && setNewCat((c) => ({ ...c, open: false }))} dismissible={!newCat.busy} title="Create a category" description="Categories help members find materials."
              actions={<><Button variant="text" disabled={newCat.busy} onClick={() => setNewCat((c) => ({ ...c, open: false }))}>Cancel</Button><Button loading={newCat.busy} onClick={addCategory}>Create category</Button></>}>
              <Input label="Category name" value={newCat.name} onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value, error: null }))} error={newCat.error ?? undefined} disabled={newCat.busy} />
            </Modal>
          </div>
        );
      }}
    </AsyncView>
  );
}
