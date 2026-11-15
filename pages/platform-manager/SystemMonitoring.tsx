import { Alert, DataTable, EmptyState, ProgressIndicator, SectionHeader, StatDisplay, StatusBadge, type DataTableColumn, type StatusVariant } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { getSystemStatus } from '../../services/platform.service';
import type { ServiceHealth, SystemService } from '../../types/platform';
import { formatWhen } from '../../utils/format';

const HEALTH: Record<ServiceHealth, { label: string; variant: StatusVariant }> = {
  operational: { label: 'Operational', variant: 'success' },
  degraded: { label: 'Degraded', variant: 'accent' },
  down: { label: 'Down', variant: 'danger' },
};

/** Platform admin: health of the services behind the library. Everything shown is reported by the backend. */
export function SystemMonitoring() {
  const { data, loading, error, reload } = useAsync(getSystemStatus, []);

  const columns: DataTableColumn<SystemService>[] = [
    { key: 'name', header: 'Service', cell: (s) => <span className="font-medium text-deep">{s.name}</span> },
    { key: 'status', header: 'Status', cell: (s) => <StatusBadge size="sm" dot label={HEALTH[s.status].label} variant={HEALTH[s.status].variant} /> },
    { key: 'detail', header: 'Details', cell: (s) => s.detail ?? '—' },
  ];

  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Checking systems…">
      {(d) => {
        const hasStorage = d.storage.totalGb > 0;
        const pct = hasStorage ? Math.round((d.storage.usedGb / d.storage.totalGb) * 100) : 0;
        const problems = d.services.filter((s) => s.status !== 'operational').length;
        return (
          <div className="space-y-6">
            {d.healthMessage && <Alert severity={problems > 0 ? 'warning' : 'info'}>{d.healthMessage}</Alert>}
            <div className="grid gap-4 sm:grid-cols-3">
              <Panel className="p-5"><StatDisplay label="Services" value={d.services.length === 0 ? '—' : `${d.services.length - problems} of ${d.services.length}`} supporting={d.services.length === 0 ? 'No health data yet' : 'operational'} /></Panel>
              <Panel className="p-5">
                <StatDisplay label="Storage used" value={hasStorage ? `${pct}%` : '—'} supporting={hasStorage ? `${d.storage.usedGb} of ${d.storage.totalGb} GB` : 'Not reported yet'} />
                {hasStorage && <div className="mt-3"><ProgressIndicator value={pct} aria-label="Storage used" /></div>}
              </Panel>
              <Panel className="p-5"><StatDisplay label="Last check" value={d.checkedAt ? formatWhen(d.checkedAt) : '—'} supporting={d.checkedAt ? undefined : 'Waiting for the backend'} /></Panel>
            </div>
            <Panel className="p-6">
              <SectionHeader title="Services" description="Reported by the backend health check." />
              <div className="mt-4">
                <DataTable caption="Service health" columns={columns} rows={d.services} getRowKey={(s) => s.id}
                  emptyState={<EmptyState title="No health data yet" description="Service status will appear here once the backend reports it." />} />
              </div>
            </Panel>
          </div>
        );
      }}
    </AsyncView>
  );
}
