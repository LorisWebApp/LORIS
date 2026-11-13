import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, ConfirmationDialog, SectionHeader, StatusBadge } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Input } from '../../components/common/Input';
import { Callout, Panel } from '../../components/common/Panel';
import { Select } from '../../components/common/Select';
import { cx } from '../../components/shared/utils/cx';
import { useAsync } from '../../hooks/useAsync';
import { discardLibraryDraft, getLibraryConfig, publishLibraryConfig } from '../../services/platform.service';
import { MATERIAL_TYPES, type LibraryConfig, type LibraryConfigState, type MaterialType } from '../../types/platform';
import { formatWhen } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

const REGISTRATION_OPTIONS = [
  { value: 'manual', label: 'Manual approval by system admin' },
  { value: 'automatic', label: 'Automatic approval' },
];

/** Human-readable list of differences between the live and edited configuration. */
function diffConfig(a: LibraryConfig, b: LibraryConfig): Array<{ label: string; from: string; to: string }> {
  const out: Array<{ label: string; from: string; to: string }> = [];
  if (a.libraryName !== b.libraryName) out.push({ label: 'Library name', from: a.libraryName, to: b.libraryName });
  if (a.organisationRegistration !== b.organisationRegistration) out.push({ label: 'Organisation registration', from: a.organisationRegistration === 'manual' ? 'Manual approval' : 'Automatic', to: b.organisationRegistration === 'manual' ? 'Manual approval' : 'Automatic' });
  if (a.allowedTypes.slice().sort().join() !== b.allowedTypes.slice().sort().join()) out.push({ label: 'Allowed material types', from: a.allowedTypes.join(', ') || 'None', to: b.allowedTypes.join(', ') || 'None' });
  if (a.maxUploadMb !== b.maxUploadMb) out.push({ label: 'Maximum upload size', from: `${a.maxUploadMb} MB`, to: `${b.maxUploadMb} MB` });
  if (a.defaultQuotaGb !== b.defaultQuotaGb) out.push({ label: 'Default organisation quota', from: `${a.defaultQuotaGb} GB`, to: `${b.defaultQuotaGb} GB` });
  if (a.maintenanceMode !== b.maintenanceMode) out.push({ label: 'Maintenance mode', from: a.maintenanceMode ? 'On' : 'Off', to: b.maintenanceMode ? 'On' : 'Off' });
  return out;
}

function validate(c: LibraryConfig): FieldErrors {
  const e: FieldErrors = {};
  if (!c.libraryName.trim()) e.libraryName = 'Enter a library name.';
  if (!Number.isFinite(c.maxUploadMb) || c.maxUploadMb < 1 || c.maxUploadMb > 5000) e.maxUploadMb = 'Enter a size between 1 and 5,000 MB.';
  if (!Number.isFinite(c.defaultQuotaGb) || c.defaultQuotaGb < 1 || c.defaultQuotaGb > 10000) e.defaultQuotaGb = 'Enter a quota between 1 and 10,000 GB.';
  if (c.allowedTypes.length === 0) e.allowedTypes = 'Allow at least one material type.';
  return e;
}

function Editor({ state, onState }: { state: LibraryConfigState; onState: (s: LibraryConfigState) => void }) {
  const [form, setForm] = useState<LibraryConfig>(state.draft ?? state.published);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<'publish' | 'discard' | null>(null);
  const [busy, setBusy] = useState(false);

  // Server state changed (publish/discard): reset the form to what is now stored.
  useEffect(() => { setForm(state.draft ?? state.published); }, [state]);

  const changes = useMemo(() => diffConfig(state.published, form), [state.published, form]);
  const set = <K extends keyof LibraryConfig>(key: K, value: LibraryConfig[K]) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: '' })); };
  const toggleType = (t: MaterialType) => set('allowedTypes', form.allowedTypes.includes(t) ? form.allowedTypes.filter((x) => x !== t) : [...form.allowedTypes, t]);

  function askPublish() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirm('publish');
  }

  async function run(kind: 'publish' | 'discard') {
    setBusy(true); setNotice(null);
    try {
      const next = kind === 'publish' ? await publishLibraryConfig(form) : await discardLibraryDraft();
      onState(next);
      setNotice({ kind: 'success', text: kind === 'publish' ? 'Changes published. They now apply to all organisations.' : 'Draft discarded. The live configuration is unchanged.' });
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); }
    finally { setBusy(false); setConfirm(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title="Library configuration" description="Review and publish changes to the shared library system." />
        {changes.length > 0 && <StatusBadge variant="accent" label={`Draft changes ${changes.length}`} />}
      </div>
      {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Panel className="p-6">
          <h3 className="text-[26px] font-medium text-deep">General &amp; access</h3>
          <div className="mt-4 space-y-4">
            <Input label="Library name" value={form.libraryName} onChange={(e) => set('libraryName', e.target.value)} error={errors.libraryName} disabled={busy} />
            <Select label="Organisation registration" placeholder={null} options={REGISTRATION_OPTIONS} value={form.organisationRegistration} onChange={(e) => set('organisationRegistration', e.target.value as LibraryConfig['organisationRegistration'])} disabled={busy} />
          </div>

          <h3 className="mt-8 text-[26px] font-medium text-deep">Materials &amp; storage</h3>
          <fieldset className="mt-4 border-0 p-0" disabled={busy}>
            <legend className="mb-1 text-[14px] font-medium text-ink">Allowed material types</legend>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_TYPES.map((t) => {
                const on = form.allowedTypes.includes(t);
                return (
                  <button key={t} type="button" role="checkbox" aria-checked={on} onClick={() => toggleType(t)}
                    className={cx('inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand', on ? 'bg-mint text-deep' : 'border border-line text-muted hover:bg-mint-soft')}>
                    {t}{on && <Check size={14} aria-hidden />}
                  </button>
                );
              })}
            </div>
            {errors.allowedTypes && <p className="mt-1 text-[14px] text-rose-text">{errors.allowedTypes}</p>}
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Maximum upload size (MB)" type="number" min={1} inputMode="numeric" value={Number.isNaN(form.maxUploadMb) ? '' : form.maxUploadMb} onChange={(e) => set('maxUploadMb', e.target.value === '' ? NaN : Number(e.target.value))} error={errors.maxUploadMb} disabled={busy} />
            <Input label="Default organisation quota (GB)" type="number" min={1} inputMode="numeric" value={Number.isNaN(form.defaultQuotaGb) ? '' : form.defaultQuotaGb} onChange={(e) => set('defaultQuotaGb', e.target.value === '' ? NaN : Number(e.target.value))} error={errors.defaultQuotaGb} disabled={busy} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
            <div>
              <p id="maint-label" className="text-[17px] font-medium text-deep">Maintenance mode</p>
              <p className="text-[14px] text-muted">Temporarily pauses library access for system updates.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted" aria-hidden>{form.maintenanceMode ? 'On' : 'Off'}</span>
              <button type="button" role="switch" aria-checked={form.maintenanceMode} aria-labelledby="maint-label" disabled={busy} onClick={() => set('maintenanceMode', !form.maintenanceMode)}
                className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', form.maintenanceMode ? 'bg-brand' : 'bg-line')}>
                <span className={cx('absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform', form.maintenanceMode && 'translate-x-5')} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={askPublish} disabled={changes.length === 0 || busy}>Publish changes</Button>
            <Button variant="secondary" onClick={() => (state.draft ? setConfirm('discard') : setForm(state.published))} disabled={busy || (changes.length === 0 && !state.draft)}>Discard draft</Button>
          </div>
          <p className="mt-2 text-[13px] text-muted">Changes apply to all organisations after publishing.</p>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-6">
            <SectionHeader title="Before you publish" description={changes.length === 0 ? 'No changes ready for review' : `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} ready for review`} />
            {changes.length > 0 && (
              <ul className="mt-3 list-none divide-y divide-line p-0">
                {changes.map((c) => (
                  <li key={c.label} className="py-3"><p className="text-[14px] text-muted">{c.label}</p><p className="text-[16px] font-medium text-deep">{c.from} <span aria-label="changes to">→</span> {c.to}</p></li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[13px] text-muted">Existing files will not be removed.</p>
          </Panel>
          <Panel className="p-6">
            <SectionHeader title="Recent changes" />
            <ul className="mt-3 list-none divide-y divide-line p-0">
              {state.recentChanges.slice(0, 4).map((c) => (
                <li key={c.id} className="py-3"><p className="text-[16px] font-medium text-deep">{c.title}</p><p className="text-[13px] text-muted">Published {formatWhen(c.publishedAt)} · {c.by}</p></li>
              ))}
            </ul>
          </Panel>
          <Callout><p className="font-medium text-deep">Every change is recorded.</p><p className="text-[14px]">A clear history keeps your library accountable.</p></Callout>
        </div>
      </div>

      <ConfirmationDialog open={confirm === 'publish'} title="Publish these changes?" description={form.maintenanceMode && !state.published.maintenanceMode ? 'Maintenance mode will pause library access for every organisation as soon as you publish.' : `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} will apply to all organisations.`} confirmLabel="Publish changes" loading={busy} onConfirm={() => run('publish')} onCancel={() => setConfirm(null)} />
      <ConfirmationDialog open={confirm === 'discard'} title="Discard the saved draft?" description="The unpublished changes will be removed. The live configuration is not affected." confirmLabel="Discard draft" tone="danger" loading={busy} onConfirm={() => run('discard')} onCancel={() => setConfirm(null)} />
    </div>
  );
}

export function LibrarySystem() {
  const { data, loading, error, reload, setData } = useAsync(getLibraryConfig, []);
  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading configuration…">
      {(state) => <Editor state={state} onState={setData} />}
    </AsyncView>
  );
}
