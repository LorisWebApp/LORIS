import { Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, EmptyState, SearchBar, SectionHeader, StatusBadge, TabNavigation } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { cx } from '../../components/shared/utils/cx';
import { useAsync } from '../../hooks/useAsync';
import { getTicket, listTickets, replyToTicket, resolveTicket } from '../../services/platform.service';
import type { Ticket, TicketFilter, TicketPriority } from '../../types/platform';
import { formatWhen, timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const PAGE_SIZE = 5;
const PRIORITY_LABEL: Record<TicketPriority, string> = { high: 'High', normal: 'Normal', low: 'Low' };

function TicketDetail({ ticketId, onChanged }: { ticketId: string; onChanged: () => void }) {
  const { data: ticket, loading, error, reload, setData } = useAsync((signal) => getTicket(ticketId, signal), [ticketId]);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'reply' | 'resolve' | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { setReply(''); setReplyError(null); setNotice(null); }, [ticketId]);

  async function send() {
    if (!reply.trim()) { setReplyError('Write a reply before sending.'); return; }
    setBusy('reply'); setNotice(null);
    try {
      setData(await replyToTicket(ticketId, reply.trim()));
      setReply(''); setNotice({ kind: 'success', text: 'Reply sent. It has been emailed to the organisation.' }); onChanged();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(null); }
  }

  async function resolve() {
    setBusy('resolve'); setNotice(null);
    try { setData(await resolveTicket(ticketId)); setNotice({ kind: 'success', text: 'Ticket marked as resolved.' }); onChanged(); }
    catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(null); }
  }

  return (
    <Panel as="article" className="p-6">
      <AsyncView data={ticket} loading={loading} error={error} onRetry={reload} loadingLabel="Loading ticket…">
        {(t: Ticket) => (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted">#{t.reference}</p>
              <StatusBadge size="sm" label={t.status === 'resolved' ? 'Resolved' : 'Open'} variant={t.status === 'resolved' ? 'success' : 'neutral'} />
            </div>
            <h2 className="mt-2 text-[30px] font-medium leading-tight text-deep">{t.subject}</h2>
            <p className="text-[15px] text-muted">{t.organisationName} · {t.contactEmail}</p>

            <dl className="mt-5 grid grid-cols-3 gap-4 border-y border-line py-4">
              <div><dt className="text-[13px] text-muted">Priority</dt><dd className={cx('text-[16px] font-medium', t.priority === 'high' ? 'text-rose-text' : 'text-deep')}>{PRIORITY_LABEL[t.priority]}</dd></div>
              <div><dt className="text-[13px] text-muted">Assigned to</dt><dd className="text-[16px] font-medium text-deep">{t.assignee}</dd></div>
              <div><dt className="text-[13px] text-muted">Received</dt><dd className="text-[16px] font-medium text-deep">{formatWhen(t.receivedAt)}</dd></div>
            </dl>

            <ol className="mt-5 list-none space-y-5 p-0">
              {t.messages.map((m) => (
                <li key={m.id}>
                  <p className="text-[13px] font-semibold text-muted">{m.authorType === 'admin' ? 'Reply from' : 'Message from'} {m.author} · {timeAgo(m.sentAt)}</p>
                  <p className="mt-1 text-[17px] leading-7 text-deep">{m.body}</p>
                  {m.attachment && <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-muted"><Paperclip size={14} aria-hidden />Attachment: {m.attachment.name} · {m.attachment.sizeKb} KB</p>}
                </li>
              ))}
            </ol>

            {notice && <Alert className="mt-5" severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

            {t.status === 'open' ? (
              <div className="mt-6">
                <label htmlFor="ticket-reply" className="mb-1 block text-[14px] font-medium text-ink">Your reply</label>
                <textarea
                  id="ticket-reply" rows={4} placeholder="Write a helpful response…" value={reply} disabled={busy !== null}
                  onChange={(e) => { setReply(e.target.value); setReplyError(null); }}
                  aria-invalid={replyError ? true : undefined} aria-describedby={replyError ? 'ticket-reply-error' : undefined}
                  className="w-full rounded-lg border border-line bg-mint-soft p-3 text-[16px] text-deep outline-none placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                />
                {replyError && <p id="ticket-reply-error" className="mt-1 text-[14px] text-rose-text">{replyError}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button onClick={send} loading={busy === 'reply'} disabled={busy === 'resolve'}>Send reply</Button>
                  <Button variant="secondary" onClick={resolve} loading={busy === 'resolve'} disabled={busy === 'reply'}>Mark resolved</Button>
                </div>
                <p className="mt-2 text-[13px] text-muted">Replies are emailed to the organisation.</p>
              </div>
            ) : (
              <p className="mt-6 border-t border-line pt-4 text-[15px] text-muted">This ticket is resolved. No further replies are needed.</p>
            )}
          </>
        )}
      </AsyncView>
    </Panel>
  );
}

export function SupportTickets() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<TicketFilter>('open');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => listTickets({ filter, q, page, pageSize: PAGE_SIZE }, signal), [filter, q, page]);

  const selectedParam = params.get('ticket');
  const selectedId = selectedParam ?? data?.items[0]?.id ?? null;
  const select = (id: string) => setParams({ ticket: id }, { replace: true });
  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader title="Support inbox" description={data ? `${data.counts.open} open tickets · ${data.counts.awaiting_reply} waiting for your reply` : undefined} />
        <SearchBar appearance="raised" placeholder="Search ticket or organisation…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-72" />
      </div>

      <TabNavigation
        aria-label="Filter tickets" variant="pill" activeId={filter}
        onChange={(id) => { setFilter(id as TicketFilter); setPage(1); }}
        tabs={[
          { id: 'open', label: 'Open', count: data?.counts.open },
          { id: 'awaiting_reply', label: 'Awaiting reply', count: data?.counts.awaiting_reply },
          { id: 'resolved', label: 'Resolved', count: data?.counts.resolved },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,1fr)_2fr]">
        <Panel as="div" className="overflow-hidden">
          <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading tickets…">
            {(d) => (
              <>
                {d.items.length === 0 ? (
                  <EmptyState title="No tickets" description={q ? 'No tickets match your search.' : 'Nothing in this view right now.'} />
                ) : (
                  <ul className="m-0 list-none divide-y divide-line p-0" aria-label="Tickets">
                    {d.items.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => select(t.id)} aria-current={t.id === selectedId ? 'true' : undefined}
                          className={cx('block w-full px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand', t.id === selectedId ? 'bg-mint' : 'hover:bg-mint-soft')}>
                          <p className="text-[12px] text-muted">#{t.reference}</p>
                          <p className="text-[17px] font-medium text-deep">{t.subject}</p>
                          <p className="text-[14px] text-muted">{t.organisationName}</p>
                          <p className="mt-1 text-[13px]"><span className={t.priority === 'high' ? 'font-semibold text-rose-text' : 'text-muted'}>{PRIORITY_LABEL[t.priority]}</span><span className="text-muted"> · {timeAgo(t.receivedAt)}</span></p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[14px] text-muted">
                  <span>Showing {d.items.length} of {d.total}</span>
                  <span className="flex gap-3">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-semibold text-ink disabled:opacity-40">← Previous</button>
                    <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="font-semibold text-ink disabled:opacity-40">Next →</button>
                  </span>
                </div>
              </>
            )}
          </AsyncView>
        </Panel>

        {selectedId ? <TicketDetail key={selectedId} ticketId={selectedId} onChanged={reload} /> : !loading && <Panel className="p-6"><EmptyState title="Select a ticket" description="Choose a ticket from the list to read and reply." /></Panel>}
      </div>
    </div>
  );
}
