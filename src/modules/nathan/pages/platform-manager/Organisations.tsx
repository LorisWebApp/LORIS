import { useMemo, useState } from 'react';
import { DataTable, EmptyState, SearchBar, SectionHeader, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { listOrganisations } from '../../services/platform.service';
import type { OrganisationSummary } from '../../types/platform';
import { formatDate } from '../../utils/format';

const columns: DataTableColumn<OrganisationSummary>[] = [
  { key: 'name', header: 'Organisation', cell: (o) => <span className="font-medium text-deep">{o.name}</span> },
  { key: 'type', header: 'Type' },
  { key: 'country', header: 'Country' },
  { key: 'city', header: 'City / town' },
  { key: 'members', header: 'Members', align: 'right' },
  { key: 'joinedAt', header: 'Joined', cell: (o) => formatDate(o.joinedAt) },
];

/** Read-only list of accepted organisations (no management actions yet). */
export function Organisations() {
  const { data, loading, error, reload } = useAsync(listOrganisations, []);
  const [q, setQ] = useState('');
  const rows = useMemo(() => (data ?? []).filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title="Organisations" description={data ? `${data.length} organisations share this library.` : undefined} />
        <SearchBar appearance="raised" placeholder="Search organisations…" onChange={setQ} className="w-full border border-line sm:w-72" />
      </div>
      <div className="mt-4">
        <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading organisations…">
          {() => <DataTable caption="Organisations" columns={columns} rows={rows} getRowKey={(o) => o.id} emptyState={<EmptyState title="No matching organisations" description="Try a different name." />} />}
        </AsyncView>
      </div>
    </Panel>
  );
}
