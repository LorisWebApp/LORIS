import { useState } from 'react';
import { DataTable, EmptyState, Pagination, SearchBar, SectionHeader, StatusBadge, TabNavigation, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { listPlatformUsers } from '../../services/platform.service';
import type { PlatformUser, PlatformUserFilter } from '../../types/user';

const PAGE_SIZE = 8;
const ROLE_LABEL: Record<PlatformUser['role'], string> = { organisation_admin: 'Organisation admin', member: 'Member' };

/** Platform admin: read-only directory of everyone using the library, across organisations. */
export function PlatformUsers() {
  const [role, setRole] = useState<PlatformUserFilter>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => listPlatformUsers({ role, q, page, pageSize: PAGE_SIZE }, signal), [role, q, page]);

  const columns: DataTableColumn<PlatformUser>[] = [
    { key: 'user', header: 'Name / email', cell: (u) => (<><p className="font-medium text-deep">{u.fullName}</p><p className="text-[14px] text-muted">{u.email}</p></>) },
    { key: 'role', header: 'Role', cell: (u) => ROLE_LABEL[u.role] },
    { key: 'org', header: 'Organisation', cell: (u) => u.organisationName ?? '—' },
    { key: 'verified', header: 'Email', cell: (u) => <StatusBadge size="sm" label={u.emailVerified ? 'Verified' : 'Unverified'} variant={u.emailVerified ? 'success' : 'neutral'} /> },
  ];

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title="Platform users" description="Everyone with an account, across all organisations." />
        <SearchBar appearance="raised" placeholder="Search name, email or organisation…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-72" />
      </div>
      <div className="mt-5">
        <TabNavigation aria-label="Filter users by role" variant="pill" activeId={role} onChange={(id) => { setRole(id as PlatformUserFilter); setPage(1); }}
          tabs={[{ id: 'all', label: 'All', count: data?.counts.all }, { id: 'organisation_admin', label: 'Organisation admins', count: data?.counts.organisation_admin }, { id: 'member', label: 'Members', count: data?.counts.member }]} />
      </div>
      <div className="mt-4">
        <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading users…">
          {(d) => (
            <>
              <DataTable caption="Platform users" columns={columns} rows={d.items} loading={loading} getRowKey={(u) => u.id}
                emptyState={<EmptyState title={q ? 'No matching users' : 'No users yet'} description={q ? 'Try a different name, email or organisation.' : 'Users appear here once organisations are accepted and people join.'} />} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                <p>{d.total === 0 ? 'Showing 0 of 0' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + d.items.length} of ${d.total}`}</p>
                <Pagination page={page} totalItems={d.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </div>
            </>
          )}
        </AsyncView>
      </div>
    </Panel>
  );
}
