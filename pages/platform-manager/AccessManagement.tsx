import { useState } from 'react';
import { Alert, Button, ConfirmationDialog, DataTable, EmptyState, SectionHeader, StatDisplay, StatusBadge, type DataTableColumn } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { changeOrganisationAccess, listOrganisationAccess } from '../../services/platform.service';
import type { AccessAction, OrganisationAccess } from '../../types/organisation';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

/** Platform admin: suspend or restore an organisation's access to the library. */
export function AccessManagement() {
  const { data, loading, error, reload } = useAsync(listOrganisationAccess, []);
  const [pending, setPending] = useState<{ org: OrganisationAccess; action: AccessAction } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await changeOrganisationAccess(pending.org.id, pending.action);
      setNotice({ kind: 'success', text: `${pending.org.name} was ${pending.action === 'suspend' ? 'suspended' : 'restored'}.` });
      reload();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(false); setPending(null); }
  }

  const columns: DataTableColumn<OrganisationAccess>[] = [
    { key: 'name', header: 'Organisation', cell: (o) => <span className="font-medium text-deep">{o.name}</span> },
    { key: 'members', header: 'Members', align: 'right', cell: (o) => formatNumber(o.members) },
    { key: 'ends', header: 'Access ends', cell: (o) => (o.accessEndsAt ? formatDate(o.accessEndsAt) : '—') },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge size="sm" label={o.status === 'active' ? 'Active' : 'Suspended'} variant={o.status === 'active' ? 'success' : 'danger'} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (o) => o.status === 'active'
      ? <Button size="sm" variant="outline" onClick={() => setPending({ org: o, action: 'suspend' })} aria-label={`Suspend ${o.name}`}>Suspend</Button>
      : <Button size="sm" onClick={() => setPending({ org: o, action: 'restore' })} aria-label={`Restore ${o.name}`}>Restore</Button> },
  ];

  return (
    <div className="space-y-6">
      {notice && <Alert severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}
      <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading access…">
        {(rows) => (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Panel className="p-5"><StatDisplay label="Organisations" value={formatNumber(rows.length)} /></Panel>
              <Panel className="p-5"><StatDisplay label="Active" value={formatNumber(rows.filter((o) => o.status === 'active').length)} /></Panel>
              <Panel className="p-5"><StatDisplay label="Suspended" value={formatNumber(rows.filter((o) => o.status === 'suspended').length)} /></Panel>
            </div>
            <Panel className="p-6">
              <SectionHeader title="Library access" description="A suspended organisation cannot sign in until access is restored." />
              <div className="mt-4">
                <DataTable caption="Organisation access" columns={columns} rows={rows} getRowKey={(o) => o.id}
                  emptyState={<EmptyState title="No organisations yet" description="Organisations appear here once their registration is accepted." />} />
              </div>
            </Panel>
          </>
        )}
      </AsyncView>
      <ConfirmationDialog open={pending !== null} onCancel={() => setPending(null)} onConfirm={() => void confirm()} loading={busy}
        title={pending?.action === 'suspend' ? 'Suspend access?' : 'Restore access?'}
        description={pending ? (pending.action === 'suspend' ? `${pending.org.name} will be blocked from signing in.` : `${pending.org.name} will be able to sign in again.`) : ''}
        confirmLabel={pending?.action === 'suspend' ? 'Suspend' : 'Restore'} tone={pending?.action === 'suspend' ? 'danger' : 'default'} />
    </div>
  );
}
