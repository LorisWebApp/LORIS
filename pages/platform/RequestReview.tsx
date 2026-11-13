import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, ConfirmationDialog, DetailRow, Modal } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Callout, Panel } from '../../components/common/Panel';
import { NotificationsAside } from '../../components/organisation/NotificationsAside';
import { RequestStatusBadge } from '../../components/organisation/RequestStatusBadge';
import type { PlatformShellContext } from '../../components/layouts/PlatformLayout';
import { usePlatformShell } from '../../components/layouts/PlatformLayout';
import { useAsync } from '../../hooks/useAsync';
import { decideRequest, getRequest } from '../../services/platform.service';
import type { RequestDecision } from '../../types/platform';
import { formatWhen } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

type Dialog = null | 'accept' | 'reject' | 'details';

const SUCCESS: Record<RequestDecision, string> = {
  accept: 'Request accepted. The organisation has been granted library access.',
  reject: 'Request rejected. The organisation has been informed.',
  more_details: 'Your questions have been sent. The request stays open until they reply.',
};

export function RequestReview() {
  const { requestId = '' } = useParams();
  const { shell, markAllRead } = usePlatformShell() as PlatformShellContext;
  const { data: request, loading, error, reload, setData } = useAsync((signal) => getRequest(requestId, signal), [requestId]);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function submit(decision: RequestDecision) {
    if (decision === 'more_details' && !message.trim()) { setMessageError('Tell the organisation what you need.'); return; }
    setBusy(true);
    setResult(null);
    try {
      const updated = await decideRequest(requestId, decision, decision === 'more_details' ? message.trim() : undefined);
      setData(updated);
      setResult({ kind: 'success', text: SUCCESS[decision] });
      setDialog(null);
      setMessage('');
    } catch (err) {
      setResult({ kind: 'error', text: getErrorMessage(err) });
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  const closeDetails = () => { if (!busy) { setDialog(null); setMessageError(null); } };

  return (
    <div className="space-y-4">
      <Link to="/platform/requests" className="inline-block text-[15px] font-medium text-ink underline-offset-4 hover:underline">← All registration requests</Link>

      <div className="grid items-start gap-6 lg:grid-cols-[1.9fr_1fr]">
        <AsyncView data={request} loading={loading} error={error} onRetry={reload} loadingLabel="Loading request…">
          {(r) => {
            const open = r.status === 'pending' || r.status === 'more_details';
            return (
              <div className="space-y-4">
                {result && <Alert severity={result.kind === 'success' ? 'success' : 'error'} onDismiss={() => setResult(null)}>{result.text}</Alert>}

                <Panel className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RequestStatusBadge status={r.status} label={r.status === 'pending' ? 'Pending review' : undefined} />
                    <p className="text-[14px] text-muted">Request {r.reference} · {formatWhen(r.submittedAt)}</p>
                  </div>
                  <h2 className="mt-4 text-[32px] font-medium leading-tight text-deep">{r.organisationName}</h2>
                  <p className="text-[15px] text-muted">Organisation registration</p>

                  <dl className="mt-6 grid gap-x-10 border-t border-line pt-4 sm:grid-cols-2">
                    <DetailRow layout="stacked" label="Organisation name" value={r.organisationName} />
                    <DetailRow layout="stacked" label="Email address" value={r.email} />
                    <DetailRow layout="stacked" label="Organisation type" value={r.organisationType} />
                    <DetailRow layout="stacked" label="Country" value={r.country} />
                    <DetailRow layout="stacked" label="Province / state" value={r.provinceOrState} />
                    <DetailRow layout="stacked" label="City / town" value={r.cityOrTown} />
                    <DetailRow layout="stacked" label="Postal code" value={r.postalCode} />
                    <DetailRow layout="stacked" label="Submitted by" value={r.submittedBy} />
                  </dl>

                  {r.decisionMessage && (
                    <p className="mt-4 rounded-md bg-mint-soft p-3 text-[15px] text-ink/80"><span className="font-semibold text-deep">Last message sent: </span>{r.decisionMessage}</p>
                  )}

                  {open ? (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="mb-3 text-[14px] text-muted">Choose how to proceed</p>
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setDialog('accept')}>Accept request</Button>
                        <Button variant="dangerSoft" onClick={() => setDialog('reject')}>Reject request</Button>
                        <Button variant="secondary" onClick={() => setDialog('details')}>Ask for details</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-6 border-t border-line pt-5 text-[15px] text-muted">This request has been {r.status === 'accepted' ? 'accepted' : 'rejected'}. No further action is needed.</p>
                  )}
                </Panel>

                <Callout>
                  <p className="font-medium text-deep">Keep the organisation informed</p>
                  <p className="text-[15px]">Your decision is emailed to {r.email}. Asking for details keeps the request open.</p>
                </Callout>

                <ConfirmationDialog open={dialog === 'accept'} title="Accept this request?" description={`${r.organisationName} will be granted library access and notified at ${r.email}.`} confirmLabel="Accept request" loading={busy} onConfirm={() => submit('accept')} onCancel={() => setDialog(null)} />
                <ConfirmationDialog open={dialog === 'reject'} tone="danger" title="Reject this request?" description={`${r.organisationName} will be told their request was not approved. This can't be undone.`} confirmLabel="Reject request" loading={busy} onConfirm={() => submit('reject')} onCancel={() => setDialog(null)} />
                <Modal
                  open={dialog === 'details'} onClose={closeDetails} dismissible={!busy} title="Ask for details" description={`Your message is emailed to ${r.email}. The request stays open.`}
                  actions={<><Button variant="text" onClick={closeDetails} disabled={busy}>Cancel</Button><Button onClick={() => submit('more_details')} loading={busy}>Send message</Button></>}
                >
                  <label htmlFor="details-message" className="mb-1 block text-[14px] font-medium text-ink">What do you need to know?</label>
                  <textarea
                    id="details-message" rows={4} value={message} onChange={(e) => { setMessage(e.target.value); setMessageError(null); }}
                    aria-invalid={messageError ? true : undefined} aria-describedby={messageError ? 'details-error' : undefined}
                    className="w-full rounded-lg border border-line bg-mint-soft p-3 text-[16px] text-deep outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                  />
                  {messageError && <p id="details-error" className="mt-1 text-[14px] text-rose-text">{messageError}</p>}
                </Modal>
              </div>
            );
          }}
        </AsyncView>

        <NotificationsAside notifications={shell?.notifications ?? []} unread={shell?.unread ?? 0} currentLink={`/platform/requests/${requestId}`} onMarkAllRead={markAllRead} />
      </div>
    </div>
  );
}
