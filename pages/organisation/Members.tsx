import { useState } from 'react';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, Pagination, SearchBar, TabNavigation, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { InvitePanel } from '../../components/organisation/InvitePanel';
import { StatCard } from '../../components/organisation/StatCard';
import { cx } from '../../components/shared/utils/cx';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { getDashboard, listMembers, removeMember } from '../../services/organisation.service';
import type { Member, MemberFilter } from '../../types/dashboard';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const PAGE_SIZE = 6;

export function Members() {
  const { user } = useAuth();
  const dash = useAsync(getDashboard, []);
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const list = useAsync((signal) => listMembers({ filter, q, page, pageSize: PAGE_SIZE }, signal), [filter, q, page]);

  const [removing, setRemoving] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    try {
      await removeMember(removing.id);
      setNotice({ kind: 'success', text: `${removing.fullName} no longer has access to the library.` });
      setRemoving(null);
      if (list.data && list.data.items.length === 1 && page > 1) setPage(page - 1); else list.reload();
      dash.reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); setRemoving(null); } finally { setBusy(false); }
  }

  const columns: DataTableColumn<Member>[] = [
    { key: 'member', header: 'Member', cell: (m) => (<><p className="font-medium text-deep">{m.fullName}</p><p className="text-[13px] text-muted">{m.email}</p></>) },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status', cell: (m) => (
      <span className="inline-flex items-center gap-2 text-[15px] text-ink/80">
        <span aria-hidden className={cx('size-2 rounded-full', m.online ? 'bg-brand' : 'border border-muted')} />{m.online ? 'Online' : 'Offline'}
      </span>) },
    { key: 'joinedAt', header: 'Joined', cell: (m) => formatDate(m.joinedAt) },
    { key: 'access', header: 'Access', cell: (m) => <Button variant="outlineDanger" size="sm" onClick={() => setRemoving(m)} aria-label={`Remove ${m.fullName}`}>Remove</Button> },
  ];
  const from = list.data && list.data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = list.data ? Math.min(page * PAGE_SIZE, list.data.total) : 0;
  const reset = () => setPage(1);

  return (
    <AsyncView data={dash.data} loading={dash.loading} error={dash.error} onRetry={dash.reload} loadingLabel="Loading your community…">
      {(d) => (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total members" value={formatNumber(d.members.total)} supporting="Everyone with library access" />
            <StatCard label="Online now" value={formatNumber(d.members.online)} supporting="Currently on the system" />
            <StatCard label="Offline" value={formatNumber(d.members.offline)} supporting="Members not online right now" />
            <StatCard label="Active users" value={formatNumber(d.members.activeLast30Days)} supporting="Active in the last 30 days" />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-[1.9fr_1fr]">
            <InvitePanel link={d.inviteLink} onSent={dash.reload} />
            <Panel className="bg-mint p-6">
              <h2 className="text-[26px] font-medium leading-tight text-ink">Room for more discoveries</h2>
              <p className="mt-6 text-[38px] font-medium leading-none tabular-nums text-deep">{formatNumber(d.pendingInvitations)}</p>
              <p className="mt-1 text-[15px] font-semibold text-deep">Pending email invitations</p>
              <p className="mt-3 text-[14px] leading-5 text-ink/80">Invite by email or share your invitation link using Email, WhatsApp or Messages.</p>
            </Panel>
          </div>

          <section aria-labelledby="manage-members" className="space-y-4">
            <h2 id="manage-members" className="text-[32px] font-medium leading-tight text-deep">Manage members</h2>
            {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabNavigation aria-label="Filter members by status" variant="pill" activeId={filter} onChange={(id) => { setFilter(id as MemberFilter); reset(); }}
                tabs={[{ id: 'all', label: 'All members', count: list.data?.counts.all }, { id: 'online', label: 'Online', count: list.data?.counts.online }, { id: 'offline', label: 'Offline', count: list.data?.counts.offline }]} />
              <SearchBar appearance="raised" placeholder="Search by name or email" onSearch={(v) => { setQ(v.trim()); reset(); }} debounceMs={300} className="w-full border border-line sm:w-72" />
            </div>
            <Panel className="px-5 pb-4 pt-2">
              <AsyncView data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} loadingLabel="Loading members…">
                {(m) => (
                  <>
                    <DataTable caption="Members" columns={columns} rows={m.items} loading={list.loading} getRowKey={(r) => r.id}
                      emptyState={<EmptyState title="No members found" description={q ? 'Try a different name or email.' : 'Nobody is in this view right now.'} />} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                      <p>Showing {from}–{to} of {formatNumber(m.total)} members</p>
                      <Pagination page={page} totalItems={m.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                  </>
                )}
              </AsyncView>
            </Panel>
          </section>

          <ConfirmationDialog open={removing !== null} tone="danger" title={removing ? `Remove ${removing.fullName}?` : 'Remove member?'}
            description={`They will lose access to ${user?.organisationName ?? 'your'} library immediately. They can be invited again later.`}
            confirmLabel="Remove access" loading={busy} onConfirm={confirmRemove} onCancel={() => setRemoving(null)} />
        </div>
      )}
    </AsyncView>
  );
}
