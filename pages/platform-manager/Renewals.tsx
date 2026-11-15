import { useState } from 'react';
import { Alert, Button, DataTable, EmptyState, Modal, Pagination, SearchBar, SectionHeader, StatusBadge, TabNavigation, type DataTableColumn, type StatusVariant } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { Textarea } from '../../components/common/Textarea';
import { useAsync } from '../../hooks/useAsync';
import { decideRenewal, listPlatformRenewals } from '../../services/platform.service';
import type { PlatformRenewal, RenewalDecision, RenewalStatus } from '../../types/organisation';
import { formatDate, formatWhen } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const PAGE_SIZE = 8;
const STATUS: Record<RenewalStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending review', variant: 'accent' },
  approved: { label: 'Approved', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
};
const termLabel = (m: number) => (m === 12 ? '1 year' : m === 24 ? '2 years' : `${m} months`);

/** Platform admin: review renewal requests sent by organisation admins. Approving extends the organisation's access. */
export function Renewals() {
  const [status, setStatus] = useState<RenewalStatus>('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => listPlatformRenewals({ status, q, page, pageSize: PAGE_SIZE }, signal), [status, q, page]);

  const [target, setTarget] = useState<{ row: PlatformRenewal; decision: RenewalDecision } | null>(null);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function open(row: PlatformRenewal, decision: RenewalDecision) { setTarget({ row, decision }); setMessage(''); setFieldError(undefined); }

  async function confirm() {
    if (!target) return;
    if (target.decision === 'decline' && !message.trim()) { setFieldError('Tell the organisation why.'); return; }
    setBusy(true);
    try {
      await decideRenewal(target.row.id, target.decision, message.trim() || undefined);
      setNotice({ kind: 'success', text: `${target.row.reference} was ${target.decision === 'approve' ? 'approved' : 'declined'}.` });
      setTarget(null);
      reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); setTarget(null); } finally { setBusy(false); }
  }

  const columns: DataTableColumn<PlatformRenewal>[] = [
    { key: 'organisation', header: 'Organisation', cell: (r) => (<><p className="font-medium text-deep">{r.organisationName}</p><p className="text-[13px] text-muted">{r.reference} · sent {formatWhen(r.submittedAt)}</p></>) },
    { key: 'term', header: 'Period requested', cell: (r) => termLabel(r.termMonths) },
    { key: 'note', header: 'Note', cell: (r) => <span className="text-[15px] text-ink/80">{r.note ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: (r) => (<><StatusBadge size="sm" label={STATUS[r.status].label} variant={STATUS[r.status].variant} />{r.decidedAt && <p className="mt-1 text-[13px] text-muted">{formatDate(r.decidedAt)}</p>}</>) },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (r) => r.status === 'pending' ? (
      <span className="inline-flex gap-2">
        <Button size="sm" variant="outline" onClick={() => open(r, 'decline')} aria-label={`Decline ${r.reference}`}>Decline</Button>
        <Button size="sm" onClick={() => open(r, 'approve')} aria-label={`Approve ${r.reference}`}>Approve</Button>
      </span>) : null },
  ];

  return (
    <div className="space-y-6">
      {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader title="Renewal requests" description="Approve a request to extend the organisation's library access." />
          <SearchBar appearance="raised" placeholder="Search organisation or reference…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-72" />
        </div>
        <div className="mt-5">
          <TabNavigation aria-label="Filter renewals by status" variant="pill" activeId={status} onChange={(id) => { setStatus(id as RenewalStatus); setPage(1); }}
            tabs={[{ id: 'pending', label: 'Pending', count: data?.counts.pending }, { id: 'approved', label: 'Approved', count: data?.counts.approved }, { id: 'declined', label: 'Declined', count: data?.counts.declined }]} />
        </div>
        <div className="mt-4">
          <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading renewals…">
            {(d) => (
              <>
                <DataTable caption="Renewal requests" columns={columns} rows={d.items} loading={loading} getRowKey={(r) => r.id}
                  emptyState={<EmptyState title={q ? 'No matching requests' : 'Nothing here yet'} description={q ? 'Try a different organisation or reference.' : `There are no ${status} renewal requests.`} />} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                  <p>{d.total === 0 ? 'Showing 0 of 0' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + d.items.length} of ${d.total}`}</p>
                  <Pagination page={page} totalItems={d.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </div>
              </>
            )}
          </AsyncView>
        </div>
      </Panel>

      <Modal open={target !== null} onClose={() => !busy && setTarget(null)} title={target?.decision === 'approve' ? 'Approve renewal' : 'Decline renewal'}
        description={target ? `${target.row.organisationName} · ${termLabel(target.row.termMonths)}` : undefined}
        actions={<><Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>Cancel</Button><Button variant={target?.decision === 'decline' ? 'danger' : 'primary'} loading={busy} onClick={() => void confirm()}>{target?.decision === 'approve' ? 'Approve' : 'Decline'}</Button></>}>
        <Textarea label={target?.decision === 'approve' ? 'Message (optional)' : 'Reason'} value={message} onChange={(e) => setMessage(e.target.value)} error={fieldError} rows={4} />
      </Modal>
    </div>
  );
}
