import { CheckCircle2, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import type { useOfflineLibrary } from '../../hooks/useOfflineLibrary';

type Lib = ReturnType<typeof useOfflineLibrary>;

/** Online/offline + sync status + Sync now. Sits in the hero meta row on both layouts. */
export function SyncStatus({ lib, tone = 'dark' }: { lib: Lib; tone?: 'dark' }) {
  void tone;
  const { isOnline, pending, needsAttention, syncState, sync, syncMessage } = lib;
  const syncing = syncState === 'syncing';
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${isOnline ? 'bg-badge' : 'bg-amber-300'}`} />
        {isOnline ? 'Online' : 'Offline'}
      </span>
      <span className="opacity-40">•</span>
      <span>{pending === 0 ? 'No pending changes' : `${pending} pending change${pending > 1 ? 's' : ''}`}</span>
      {needsAttention > 0 && (
        <span className="inline-flex items-center gap-1 text-amber-200">
          <TriangleAlert size={12} /> {needsAttention} need attention
        </span>
      )}
      <button
        onClick={sync}
        disabled={!isOnline || syncing || pending === 0}
        title={!isOnline ? 'Reconnect to synchronise' : pending === 0 ? 'Nothing to synchronise' : undefined}
        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
      >
        <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
      {syncMessage && <span role="status" className="text-badge">{syncMessage}</span>}
    </>
  );
}

export function VerifiedIcon() {
  return <CheckCircle2 size={13} />;
}
export function OfflineIcon() {
  return <CloudOff size={13} />;
}
