import { Check, Copy, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, Modal, Pagination, ProgressIndicator, SearchBar, SectionHeader, StatusBadge, TabNavigation, type DataTableColumn, type StatusVariant } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Input } from '../../components/common/Input';
import { Panel } from '../../components/common/Panel';
import { Select } from '../../components/common/Select';
import { InvitePanel } from '../../components/organisation/InvitePanel';
import { useAsync } from '../../hooks/useAsync';
import { createInvitationCode, getDashboard, listInvitationCodes, revokeInvitationCode } from '../../services/organisation.service';
import type { InvitationCode, InvitationCodeFilter, InvitationCodeStatus } from '../../types/invitation';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';
import { ApiError } from '../../services/http';

const PAGE_SIZE = 6;
const STATUS: Record<InvitationCodeStatus, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'danger' },
};
const EXPIRY_OPTIONS = [{ value: '7', label: 'In 7 days' }, { value: '30', label: 'In 30 days' }, { value: '90', label: 'In 90 days' }, { value: '365', label: 'In 1 year' }];
const USES_OPTIONS = [{ value: 'unlimited', label: 'Unlimited' }, { value: '10', label: '10 people' }, { value: '25', label: '25 people' }, { value: '50', label: '50 people' }, { value: '100', label: '100 people' }, { value: '500', label: '500 people' }];

/** Organisation admin: invite people by email or link, and manage the codes new members join with. */
export function InvitationCodes() {
  const dash = useAsync(getDashboard, []);
  const [filter, setFilter] = useState<InvitationCodeFilter>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const list = useAsync((signal) => listInvitationCodes({ status: filter, q, page, pageSize: PAGE_SIZE }, signal), [filter, q, page]);

  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate-code dialog
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [expires, setExpires] = useState('30');
  const [uses, setUses] = useState('unlimited');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  // Revoke dialog
  const [revoking, setRevoking] = useState<InvitationCode | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const reset = () => setPage(1);

  function openCreate() { setLabel(''); setExpires('30'); setUses('unlimited'); setErrors({}); setCreating(true); }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const created = await createInvitationCode({ label: label.trim() || undefined, expiresInDays: Number(expires), maxUses: uses === 'unlimited' ? null : Number(uses) });
      setCreating(false);
      setNotice({ kind: 'success', text: `Code ${created.code} is ready. Share it with the people you want to join.` });
      if (filter !== 'all' && filter !== 'active') setFilter('all');
      if (page !== 1) setPage(1); else list.reload();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors); else setErrors({ form: getErrorMessage(err) });
    } finally { setBusy(false); }
  }

  async function confirmRevoke() {
    if (!revoking) return;
    setRevokeBusy(true);
    try {
      await revokeInvitationCode(revoking.id);
      setNotice({ kind: 'success', text: `Code ${revoking.code} was revoked. It can no longer be used to join.` });
      setRevoking(null);
      list.reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); setRevoking(null); } finally { setRevokeBusy(false); }
  }

  async function copy(c: InvitationCode) {
    try { await navigator.clipboard.writeText(c.code); setCopiedId(c.id); setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 2000); }
    catch { setNotice({ kind: 'error', text: "Copying isn't available in this browser. Select the code and copy it manually." }); }
  }

  const columns: DataTableColumn<InvitationCode>[] = [
    { key: 'code', header: 'Code', cell: (c) => (<><p className="font-semibold tracking-wide text-deep">{c.code}</p><p className="text-[13px] text-muted">{c.label}</p></>) },
    { key: 'expiresAt', header: 'Expires', cell: (c) => formatDate(c.expiresAt) },
    { key: 'uses', header: 'Used', width: 'w-48', cell: (c) => c.maxUses === null
      ? <span className="text-[15px] text-ink/80">{formatNumber(c.uses)} joined · no limit</span>
      : <ProgressIndicator size="sm" value={c.uses} max={c.maxUses} label={`${formatNumber(c.uses)} of ${formatNumber(c.maxUses)}`} /> },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge size="sm" label={STATUS[c.status].label} variant={STATUS[c.status].variant} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (c) => (
      <span className="inline-flex items-center gap-2">
        <Button variant="text" size="sm" onClick={() => copy(c)} leftIcon={copiedId === c.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} aria-label={`Copy code ${c.code}`}>{copiedId === c.id ? 'Copied' : 'Copy'}</Button>
        {c.status === 'active' && <Button variant="outline" size="sm" onClick={() => setRevoking(c)} aria-label={`Revoke code ${c.code}`}>Revoke</Button>}
      </span>) },
  ];
  const from = list.data && list.data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = list.data ? Math.min(page * PAGE_SIZE, list.data.total) : 0;

  return (
    <div className="space-y-8">
      <AsyncView data={dash.data} loading={dash.loading} error={dash.error} onRetry={dash.reload} loadingLabel="Loading invitations…">
        {(d) => (
          <div className="grid items-stretch gap-4 lg:grid-cols-[1.9fr_1fr]">
            <InvitePanel link={d.inviteLink} onSent={dash.reload} />
            <Panel className="bg-mint p-6">
              <SectionHeader as="h2" title="Waiting to join" description="Email invitations that have not been accepted yet." />
              <p className="mt-6 text-[38px] font-medium leading-none tabular-nums text-deep">{formatNumber(d.pendingInvitations)}</p>
              <p className="mt-1 text-[15px] font-semibold text-deep">Pending email invitations</p>
            </Panel>
          </div>
        )}
      </AsyncView>

      <section aria-labelledby="codes-heading" className="space-y-4">
        <SectionHeader
          title={<span id="codes-heading">Invitation codes</span>}
          description="People enter a code on the join screen to create their account in your organisation."
          actions={<Button onClick={openCreate} leftIcon={<Plus size={14} aria-hidden />}>Generate code</Button>}
        />
        {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabNavigation aria-label="Filter invitation codes by status" variant="pill" activeId={filter} onChange={(id) => { setFilter(id as InvitationCodeFilter); reset(); }}
            tabs={[
              { id: 'all', label: 'All', count: list.data?.counts.all }, { id: 'active', label: 'Active', count: list.data?.counts.active },
              { id: 'expired', label: 'Expired', count: list.data?.counts.expired }, { id: 'revoked', label: 'Revoked', count: list.data?.counts.revoked },
            ]} />
          <SearchBar appearance="raised" placeholder="Search by code or label" onSearch={(v) => { setQ(v.trim()); reset(); }} debounceMs={300} className="w-full border border-line sm:w-72" />
        </div>
        <Panel className="px-5 pb-4 pt-2">
          <AsyncView data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} loadingLabel="Loading codes…">
            {(c) => (
              <>
                <DataTable caption="Invitation codes" columns={columns} rows={c.items} loading={list.loading} getRowKey={(r) => r.id}
                  emptyState={<EmptyState title="No codes found" description={q ? 'Try a different code or label.' : 'Generate a code to let people join your organisation.'} />} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                  <p>Showing {from}–{to} of {formatNumber(c.total)} codes</p>
                  <Pagination page={page} totalItems={c.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </div>
              </>
            )}
          </AsyncView>
        </Panel>
      </section>

      <Modal
        open={creating} onClose={() => setCreating(false)} dismissible={!busy} title="Generate an invitation code"
        description="Choose how long the code works and how many people can use it."
        actions={<><Button variant="secondary" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button><Button type="submit" form="new-code-form" loading={busy}>Generate code</Button></>}
      >
        <form id="new-code-form" onSubmit={submitCreate} noValidate className="space-y-4">
          {errors.form && <Alert severity="error">{errors.form}</Alert>}
          <Input label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Autumn intake" maxLength={60} disabled={busy} />
          <Select label="Expires" options={EXPIRY_OPTIONS} placeholder={null} value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expiresInDays} disabled={busy} />
          <Select label="Can be used by" options={USES_OPTIONS} placeholder={null} value={uses} onChange={(e) => setUses(e.target.value)} error={errors.maxUses} disabled={busy} />
        </form>
      </Modal>

      <ConfirmationDialog open={revoking !== null} tone="danger" title={revoking ? `Revoke ${revoking.code}?` : 'Revoke code?'}
        description="Nobody will be able to join with this code any more. People who already joined keep their access."
        confirmLabel="Revoke code" loading={revokeBusy} onConfirm={confirmRevoke} onCancel={() => setRevoking(null)} />
    </div>
  );
}
