import { useState } from 'react';
import { DataTable, EmptyState, Pagination, SearchBar, SectionHeader, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { listActivityLogs } from '../../services/platform.service';
import type { ActivityLog } from '../../types/platform';
import { formatWhen } from '../../utils/format';

const PAGE_SIZE = 10;

/** Platform admin: newest-first audit trail of what happened on the platform. */
export function ActivityLogs() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => listActivityLogs({ q, page, pageSize: PAGE_SIZE }, signal), [q, page]);

  const columns: DataTableColumn<ActivityLog>[] = [
    { key: 'at', header: 'When', width: '12rem', cell: (l) => formatWhen(l.at) },
    { key: 'actor', header: 'Who', cell: (l) => <span className="font-medium text-deep">{l.actor}</span> },
    { key: 'action', header: 'What', cell: (l) => l.action },
    { key: 'detail', header: 'Details', cell: (l) => <span className="text-ink/80">{l.detail}</span> },
  ];

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title="Activity logs" description="Recent actions by administrators and organisations." />
        <SearchBar appearance="raised" placeholder="Search activity…" onSearch={(v) => { setQ(v.trim()); setPage(1); }} debounceMs={300} className="w-full border border-line sm:w-72" />
      </div>
      <div className="mt-4">
        <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading activity…">
          {(d) => (
            <>
              <DataTable caption="Activity logs" columns={columns} rows={d.items} loading={loading} getRowKey={(l) => l.id}
                emptyState={<EmptyState title={q ? 'No matching activity' : 'No activity yet'} description={q ? 'Try a different search.' : 'Actions will be recorded here as they happen.'} />} />
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
