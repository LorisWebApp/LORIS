import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable, EmptyState, Pagination, SearchBar, SectionHeader, TabNavigation, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Callout, Panel } from '../../components/common/Panel';
import { RequestStatusBadge } from '../../components/organisation/RequestStatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { listRequests } from '../../services/platform.service';
import type { RegistrationRequest, RequestStatus } from '../../types/platform';

const PAGE_SIZE = 10;
const STATUS_NOUN: Record<RequestStatus, string> = { pending: 'pending', more_details: 'awaiting details', accepted: 'accepted', rejected: 'rejected' };

export function RegistrationRequests() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync((signal) => listRequests({ status, q, sort, page, pageSize: PAGE_SIZE }, signal), [status, q, sort, page]);

  const columns: DataTableColumn<RegistrationRequest>[] = [
    { key: 'organisation', header: 'Organisation / email', cell: (r) => (<><p className="font-medium text-deep">{r.organisationName}</p><p className="text-[14px] text-muted">{r.email}</p></>) },
    { key: 'organisationType', header: 'Type' },
    { key: 'country', header: 'Country' },
    { key: 'provinceOrState', header: 'Province / state' },
    { key: 'cityOrTown', header: 'City / town' },
    { key: 'postalCode', header: 'Postal code' },
    { key: 'status', header: 'Status', cell: (r) => <RequestStatusBadge status={r.status} /> },
    { key: 'review', header: <span className="sr-only">Action</span>, align: 'right', cell: (r) => <Button to={`/platform/requests/${r.id}`} variant="text" size="sm" aria-label={`Review ${r.organisationName}`}>Review →</Button> },
  ];

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader title="Registration inbox" description="Review submitted details and decide who joins your library." />
          <SearchBar appearance="raised" placeholder="Search name or email…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-72" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <TabNavigation
            aria-label="Filter requests by status"
            variant="pill"
            activeId={status}
            onChange={(id) => { setStatus(id as RequestStatus); setPage(1); }}
            tabs={[
              { id: 'pending', label: 'Pending', count: data?.counts.pending },
              { id: 'more_details', label: 'More details', count: data?.counts.more_details },
              { id: 'accepted', label: 'Accepted', count: data?.counts.accepted },
              { id: 'rejected', label: 'Rejected', count: data?.counts.rejected },
            ]}
          />
          <Button variant="text" size="sm" onClick={() => { setSort((s) => (s === 'newest' ? 'oldest' : 'newest')); setPage(1); }} rightIcon={sort === 'newest' ? <ArrowDown size={14} aria-hidden /> : <ArrowUp size={14} aria-hidden />}>
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </Button>
        </div>

        <div className="mt-4">
          <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading requests…">
            {(d) => (
              <>
                <DataTable
                  caption="Organisation registration requests"
                  columns={columns}
                  rows={d.items}
                  loading={loading}
                  getRowKey={(r) => r.id}
                  onRowClick={(r) => navigate(`/platform/requests/${r.id}`)}
                  emptyState={<EmptyState title={q ? 'No matching requests' : 'Nothing here yet'} description={q ? 'Try a different name or email.' : `There are no ${STATUS_NOUN[status]} requests right now.`} />}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-muted">
                  <p>Showing {d.items.length} of {d.total} {STATUS_NOUN[status]} requests</p>
                  <Pagination page={page} totalItems={d.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </div>
              </>
            )}
          </AsyncView>
        </div>
      </Panel>

      <Callout>
        <p className="font-medium text-deep">A thoughtful welcome</p>
        <p className="text-[15px]">Open a request to verify contact and location details. Ask for more information if anything is missing.</p>
      </Callout>
    </div>
  );
}
