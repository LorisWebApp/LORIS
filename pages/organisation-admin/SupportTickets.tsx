import { LifeBuoy, Paperclip, Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, ConfirmationDialog, DetailRow, EmptyState, Modal, Pagination, SearchBar, SectionHeader, TabNavigation } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { TicketForm } from '../../components/support/TicketForm';
import { TicketStatus } from '../../components/support/TicketStatus';
import { Textarea } from '../../components/common/Textarea';
import { cx } from '../../components/shared/utils/cx';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../services/http';
import { closeOwnTicket, createTicket, getOwnTicket, listOwnTickets, replyToOwnTicket } from '../../services/organisation.service';
import type { NewTicket } from '../../types/ticket';
import type { Ticket, TicketFilter, TicketPriority } from '../../types/ticket';
import { formatWhen, timeAgo } from '../../utils/format';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

const PAGE_SIZE = 5;
const PRIORITY_LABEL: Record<TicketPriority, string> = { high: 'High', normal: 'Normal', low: 'Low' };

function TicketDetail({ ticketId, onChanged }: { ticketId: string; onChanged: () => void }) {
  const { data: ticket, loading, error, reload, setData } = useAsync((signal) => getOwnTicket(ticketId, signal), [ticketId]);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState<string | undefined>();
  const [busy, setBusy] = useState<'reply' | 'close' | null>(null);
  const [closing, setClosing] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { setReply(''); setReplyError(undefined); setNotice(null); }, [ticketId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) { setReplyError('Write a message before sending.'); return; }
    setBusy('reply'); setNotice(null);
    try {
      setData(await replyToOwnTicket(ticketId, reply.trim()));
      setReply(''); setNotice({ kind: 'success', text: 'Message sent. The support team will reply by email.' }); onChanged();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(null); }
  }

  async function close() {
    setBusy('close');
    try { setData(await closeOwnTicket(ticketId)); setNotice({ kind: 'success', text: 'Ticket closed. Reply any time if the problem comes back.' }); onChanged(); }
    catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(null); setClosing(false); }
  }

  return (
    <Panel as="article" className="p-6">
      <AsyncView data={ticket} loading={loading} error={error} onRetry={reload} loadingLabel="Loading ticket…">
        {(t: Ticket) => (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted">#{t.reference}</p>
              <TicketStatus ticket={t} perspective="organisation" />
            </div>
            <h2 className="mt-2 text-[30px] font-medium leading-tight text-deep">{t.subject}</h2>

            <dl className="mt-5 grid gap-x-6 border-y border-line py-2 sm:grid-cols-3">
              <DetailRow layout="stacked" label="Priority" value={<span className={cx(t.priority === 'high' && 'text-rose-text')}>{PRIORITY_LABEL[t.priority]}</span>} />
              <DetailRow layout="stacked" label="Handled by" value={t.assignee} />
              <DetailRow layout="stacked" label="Opened" value={formatWhen(t.receivedAt)} />
            </dl>

            <ol className="mt-5 list-none space-y-5 p-0">
              {t.messages.map((m) => (
                <li key={m.id}>
                  <p className="text-[13px] font-semibold text-muted">{m.authorType === 'admin' ? 'Reply from support' : `You (${m.author})`} · {timeAgo(m.sentAt)}</p>
                  <p className="mt-1 text-[17px] leading-7 text-deep">{m.body}</p>
                  {m.attachment && <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-muted"><Paperclip size={14} aria-hidden />Attachment: {m.attachment.name} · {m.attachment.sizeKb} KB</p>}
                </li>
              ))}
            </ol>

            {notice && <Alert className="mt-5" severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

            {t.status === 'open' ? (
              <form onSubmit={send} noValidate className="mt-6">
                <Textarea label="Add a message" rows={4} placeholder="Add more detail or answer a question from support…" value={reply} disabled={busy !== null}
                  onChange={(e) => { setReply(e.target.value); setReplyError(undefined); }} error={replyError} />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="submit" loading={busy === 'reply'} disabled={busy === 'close'}>Send message</Button>
                  <Button variant="secondary" onClick={() => setClosing(true)} disabled={busy !== null}>Close ticket</Button>
                </div>
              </form>
            ) : (
              <p className="mt-6 border-t border-line pt-4 text-[15px] text-muted">This ticket is resolved. Open a new ticket if you need more help.</p>
            )}

            <ConfirmationDialog open={closing} title="Close this ticket?" description="Use this when the problem is solved. You will not be able to add messages afterwards."
              confirmLabel="Close ticket" loading={busy === 'close'} onConfirm={close} onCancel={() => setClosing(false)} />
          </>
        )}
      </AsyncView>
    </Panel>
  );
}

/** Organisation admin: contact the platform team, and follow every conversation. */
export function SupportTickets() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<TicketFilter>('open');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => listOwnTickets({ filter, q, page, pageSize: PAGE_SIZE }, signal), [filter, q, page]);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewTicket>({ subject: '', priority: 'normal', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const selectedParam = params.get('ticket');
  const selectedId = selectedParam ?? data?.items[0]?.id ?? null;
  const select = (id: string) => setParams({ ticket: id }, { replace: true });

  function openCreate() { setForm({ subject: '', priority: 'normal', message: '' }); setErrors({}); setCreating(true); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!form.subject.trim()) next.subject = 'Enter a subject.';
    if (!form.message.trim()) next.message = 'Describe the problem so we can help.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const t = await createTicket({ ...form, subject: form.subject.trim(), message: form.message.trim() });
      setCreating(false);
      setNotice({ kind: 'success', text: `Ticket ${t.reference} was sent. We will reply by email.` });
      setFilter('open'); setQ(''); setPage(1);
      setParams({ ticket: t.id }, { replace: true });
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors); else setErrors({ form: getErrorMessage(err) });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader title="Support" description={data ? `${data.counts.open} open · ${data.counts.awaiting_reply} waiting for support` : 'Ask the platform team for help.'} />
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <SearchBar appearance="raised" placeholder="Search your tickets…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-64" />
          <Button onClick={openCreate} leftIcon={<Plus size={14} aria-hidden />}>New ticket</Button>
        </div>
      </div>
      {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

      <TabNavigation aria-label="Filter tickets" variant="pill" activeId={filter} onChange={(id) => { setFilter(id as TicketFilter); setPage(1); }}
        tabs={[{ id: 'open', label: 'Open', count: data?.counts.open }, { id: 'awaiting_reply', label: 'Waiting for support', count: data?.counts.awaiting_reply }, { id: 'resolved', label: 'Resolved', count: data?.counts.resolved }]} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,1fr)_2fr]">
        <Panel as="div" className="overflow-hidden">
          <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading tickets…">
            {(d) => (
              <>
                {d.items.length === 0 ? (
                  <EmptyState icon={<LifeBuoy size={28} aria-hidden />} title="No tickets" description={q ? 'No tickets match your search.' : 'Nothing in this view right now.'}
                    action={!q && filter === 'open' ? <Button variant="outline" onClick={openCreate}>Contact support</Button> : undefined} />
                ) : (
                  <ul className="m-0 list-none divide-y divide-line p-0" aria-label="Tickets">
                    {d.items.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => select(t.id)} aria-current={t.id === selectedId ? 'true' : undefined}
                          className={cx('block w-full px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand', t.id === selectedId ? 'bg-mint' : 'hover:bg-mint-soft')}>
                          <p className="text-[12px] text-muted">#{t.reference}</p>
                          <p className="text-[17px] font-medium text-deep">{t.subject}</p>
                          <p className="mt-1 text-[13px]"><span className={t.priority === 'high' ? 'font-semibold text-rose-text' : 'text-muted'}>{PRIORITY_LABEL[t.priority]}</span><span className="text-muted"> · {timeAgo(t.receivedAt)}</span></p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {d.total > PAGE_SIZE && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[14px] text-muted">
                    <span>Showing {d.items.length} of {d.total}</span>
                    <Pagination page={page} totalItems={d.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </AsyncView>
        </Panel>

        {selectedId ? <TicketDetail key={selectedId} ticketId={selectedId} onChanged={reload} />
          : !loading && <Panel className="p-6"><EmptyState title="Select a ticket" description="Choose a ticket from the list to read and reply." /></Panel>}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} dismissible={!busy} title="Contact support" description="Tell us what is happening. We reply by email and in this list."
        actions={<><Button variant="secondary" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button><Button type="submit" form="new-ticket-form" loading={busy}>Send ticket</Button></>}>
        <TicketForm id="new-ticket-form" value={form} onChange={setForm} onSubmit={submit} errors={errors} disabled={busy} />
      </Modal>
    </div>
  );
}
