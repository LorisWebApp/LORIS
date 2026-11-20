import { CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { Button, OfflineIndicator } from '../shared';

type Lib = ReturnType<typeof useOfflineLibrary>;

/** Online/offline + sync status + Sync now. Sits in the hero meta row on both layouts (dark surface). */
export function SyncStatus({ lib }: { lib: Lib }) {
  const { isOnline, pending, needsAttention, syncState, sync, syncMessage } = lib;
  const syncing = syncState === 'syncing';
  return (
    <>
      <OfflineIndicator isOnline={isOnline} tone="inverse" className="text-inherit" />
      <span className="opacity-40">•</span>
      <span>{pending === 0 ? 'No pending changes' : `${pending} pending change${pending > 1 ? 's' : ''}`}</span>
      {needsAttention > 0 && (
        <span className="inline-flex items-center gap-1 text-amber-200"><TriangleAlert size={12} /> {needsAttention} need attention</span>
      )}
      <Button
        variant="secondary" tone="inverse" size="sm" shape="pill"
        onClick={sync} loading={syncing}
        disabled={!isOnline || pending === 0}
        title={!isOnline ? 'Reconnect to synchronise' : pending === 0 ? 'Nothing to synchronise' : undefined}
        leftIcon={<RefreshCw size={12} />}
      >
        {syncing ? 'Syncing…' : 'Sync now'}
      </Button>
      {syncMessage && <span role="status" className="text-badge">{syncMessage}</span>}
    </>
  );
}

export function VerifiedIcon() {
  return <CheckCircle2 size={13} />;
}
