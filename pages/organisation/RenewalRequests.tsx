import { useState, type FormEvent } from 'react';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, SectionHeader, StatDisplay, StatusBadge, type DataTableColumn, type StatusVariant } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../services/http';
import { getRenewals, requestRenewal, withdrawRenewal } from '../../services/organisation.service';
import type { RenewalRequest, RenewalStatus, RenewalTerm } from '../../types/organisationAdmin';
import { formatDate, formatWhen } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

const STATUS: Record<RenewalStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending review', variant: 'accent' },
  approved: { label: 'Approved', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
};
const TERM_OPTIONS = [{ value: '6', label: '6 months' }, { value: '12', label: '1 year' }, { value: '24', label: '2 years' }];
const termLabel = (m: number) => TERM_OPTIONS.find((o) => o.value === String(m))?.label ?? `${m} months`;
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/** Organisation admin: ask the platform administrators to extend library access, and follow the request. */
export function RenewalRequests() {
  const { data, loading, error, reload } = useAsync(getRenewals, []);
  const [term, setTerm] = useState('12');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState<RenewalRequest | null>(null);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setNotice(null);
    try {
      const created = await requestRenewal({ termMonths: Number(term) as RenewalTerm, note: note.trim() || undefined });
      setNote('');
      setNotice({ kind: 'success', text: `Request ${created.reference} was sent. We will email you when it has been reviewed.` });
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors); else setNotice({ kind: 'error', text: getErrorMessage(err) });
    } finally { setBusy(false); }
  }

  async function confirmWithdraw() {
    if (!withdrawing) return;
    setWithdrawBusy(true);
    try {
      await withdrawRenewal(withdrawing.id);
      setNotice({ kind: 'success', text: `Request ${withdrawing.reference} was withdrawn.` });
      setWithdrawing(null);
      reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); setWithdrawing(null); } finally { setWithdrawBusy(false); }
  }

  const columns: DataTableColumn<RenewalRequest>[] = [
    { key: 'reference', header: 'Request', cell: (r) => (<><p className="font-medium text-deep">{r.reference}</p><p className="text-[13px] text-muted">Sent {formatWhen(r.submittedAt)}</p></>) },
    { key: 'term', header: 'Renewal period', cell: (r) => termLabel(r.termMonths) },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge size="sm" label={STATUS[r.status].label} variant={STATUS[r.status].variant} /> },
    { key: 'decision', header: 'Reply', cell: (r) => (
      <span className="text-[15px] text-ink/80">{r.decisionMessage ?? (r.status === 'pending' ? 'Waiting for the platform team.' : '—')}{r.decidedAt && <span className="block text-[13px] text-muted">Decided {formatDate(r.decidedAt)}</span>}</span>) },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (r) => r.status === 'pending'
      ? <Button variant="outline" size="sm" onClick={() => setWithdrawing(r)} aria-label={`Withdraw request ${r.reference}`}>Withdraw</Button> : null },
  ];

  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading renewals…">
      {(d) => {
        const days = d.accessEndsAt ? daysUntil(d.accessEndsAt) : null;
        const pending = d.requests.find((r) => r.status === 'pending');
        const lastApproved = d.requests.find((r) => r.status === 'approved');
        return (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <Panel className="p-5"><StatDisplay label="Access ends" value={d.accessEndsAt ? formatDate(d.accessEndsAt) : '—'} supporting={days === null ? 'Not set yet' : days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} remaining` : 'Access has ended'} /></Panel>
              <Panel className="p-5"><StatDisplay label="Open request" value={pending ? pending.reference : 'None'} supporting={pending ? `${termLabel(pending.termMonths)} · waiting for review` : 'You can send a new request below'} /></Panel>
              <Panel className="p-5"><StatDisplay label="Last renewal" value={lastApproved?.decidedAt ? formatDate(lastApproved.decidedAt) : '—'} supporting={lastApproved ? `${termLabel(lastApproved.termMonths)} approved` : 'No approved renewals yet'} /></Panel>
            </div>

            {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
            {days !== null && days <= 60 && days > 0 && !pending && <Alert severity="warning" title="Your access ends soon">Send a renewal request so your community keeps reading without a break.</Alert>}

            <Panel className="p-6" aria-labelledby="new-renewal">
              <SectionHeader as="h2" title={<span id="new-renewal">Request a renewal</span>} description="The platform team reviews every request and replies by email." />
              {pending ? (
                <Alert className="mt-4" severity="info">Request {pending.reference} is already waiting for review. Withdraw it below if you want to send a different one.</Alert>
              ) : (
                <form onSubmit={submit} noValidate className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(200px,1fr)_2fr]">
                  <Select label="Renew for" options={TERM_OPTIONS} placeholder={null} value={term} onChange={(e) => setTerm(e.target.value)} error={errors.termMonths} disabled={busy} />
                  <Textarea label="Note for the platform team (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know, for example a change of billing contact." maxLength={500} disabled={busy} />
                  <div className="md:col-span-2"><Button type="submit" loading={busy}>Send renewal request</Button></div>
                </form>
              )}
            </Panel>

            <section aria-labelledby="renewal-history" className="space-y-4">
              <SectionHeader title={<span id="renewal-history">Your requests</span>} description="Every renewal request your organisation has sent." />
              <Panel className="px-5 pb-4 pt-2">
                <DataTable caption="Renewal requests" columns={columns} rows={d.requests} getRowKey={(r) => r.id} emptyState={<EmptyState title="No requests yet" description="Renewal requests you send will appear here." />} />
              </Panel>
            </section>

            <ConfirmationDialog open={withdrawing !== null} tone="danger" title={withdrawing ? `Withdraw ${withdrawing.reference}?` : 'Withdraw request?'}
              description="The platform team will no longer review this request. You can send a new one at any time."
              confirmLabel="Withdraw request" loading={withdrawBusy} onConfirm={confirmWithdraw} onCancel={() => setWithdrawing(null)} />
          </div>
        );
      }}
    </AsyncView>
  );
}
