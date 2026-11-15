import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, Pagination, SearchBar, SectionHeader, StatDisplay, StatusBadge, TabNavigation, UserAvatar, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';
import { getDashboard, listMembers, removeMember } from '../../services/organisation.service';
import type { Member, MemberFilter } from '../../types/dashboard';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const PAGE_SIZE = 6;

/** Organisation admin: see who has library access, search and filter, and remove access. */
export function ManageUsers() {
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
    { key: 'member', header: 'User', cell: (m) => (
      <span className="flex items-center gap-3">
        <UserAvatar name={m.fullName} size="sm" tone="light" />
        <span><span className="block font-medium text-deep">{m.fullName}</span><span className="block text-[13px] text-muted">{m.email}</span></span>
      </span>) },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status', cell: (m) => <StatusBadge dot size="sm" variant={m.online ? 'success' : 'neutral'} label={m.online ? 'Online' : 'Offline'} /> },
    { key: 'joinedAt', header: 'Joined', cell: (m) => formatDate(m.joinedAt) },
    { key: 'access', header: 'Access', align: 'right', cell: (m) => <Button variant="outline" size="sm" onClick={() => setRemoving(m)} aria-label={`Remove ${m.fullName}`}>Remove</Button> },
  ];
  const from = list.data && list.data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = list.data ? Math.min(page * PAGE_SIZE, list.data.total) : 0;
  const reset = () => setPage(1);

  return (
    <AsyncView data={dash.data} loading={dash.loading} error={dash.error} onRetry={dash.reload} loadingLabel="Loading your community…">
      {(d) => (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Panel className="p-5"><StatDisplay label="Total users" value={formatNumber(d.members.total)} supporting="Everyone with library access" /></Panel>
            <Panel className="p-5"><StatDisplay label="Online now" value={formatNumber(d.members.online)} supporting="Currently on the system" /></Panel>
            <Panel className="p-5"><StatDisplay label="Offline" value={formatNumber(d.members.offline)} supporting="Not online right now" /></Panel>
            <Panel className="p-5"><StatDisplay label="Active users" value={formatNumber(d.members.activeLast30Days)} supporting="Active in the last 30 days" /></Panel>
          </div>

          <section aria-labelledby="manage-users" className="space-y-4">
            <SectionHeader
              title={<span id="manage-users">Manage users</span>}
              description="Search your community and remove access when someone leaves."
              actions={<Button to={ROUTES.organisationInvitations} variant="outline" size="sm" leftIcon={<UserPlus size={14} aria-hidden />}>Invite people</Button>}
            />
            {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabNavigation aria-label="Filter users by status" variant="pill" activeId={filter} onChange={(id) => { setFilter(id as MemberFilter); reset(); }}
                tabs={[{ id: 'all', label: 'All users', count: list.data?.counts.all }, { id: 'online', label: 'Online', count: list.data?.counts.online }, { id: 'offline', label: 'Offline', count: list.data?.counts.offline }]} />
              <SearchBar appearance="raised" placeholder="Search by name or email" onSearch={(v) => { setQ(v.trim()); reset(); }} debounceMs={300} className="w-full border border-line sm:w-72" />
            </div>
            <Panel className="px-5 pb-4 pt-2">
              <AsyncView data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} loadingLabel="Loading users…">
                {(m) => (
                  <>
                    <DataTable caption="Users" columns={columns} rows={m.items} loading={list.loading} getRowKey={(r) => r.id}
                      emptyState={<EmptyState title="No users found" description={q ? 'Try a different name or email.' : 'Nobody is in this view right now.'} />} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                      <p>Showing {from}–{to} of {formatNumber(m.total)} users</p>
                      <Pagination page={page} totalItems={m.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                  </>
                )}
              </AsyncView>
            </Panel>
          </section>

          <ConfirmationDialog open={removing !== null} tone="danger" title={removing ? `Remove ${removing.fullName}?` : 'Remove user?'}
            description={`They will lose access to ${user?.organisationName ?? 'your'} library immediately. They can be invited again later.`}
            confirmLabel="Remove access" loading={busy} onConfirm={confirmRemove} onCancel={() => setRemoving(null)} />
        </div>
      )}
    </AsyncView>
  );
}
