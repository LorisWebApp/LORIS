import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OfflineMaterialMetadata } from '../group-d/types/models';
import { useNetworkStatus } from '../group-d/hooks/useNetworkStatus';
import {
  getOfflineMaterial,
  getOfflineStorageUsage,
  listOfflineMaterials,
  removeOfflineMaterial,
} from '../group-d/offline/offlineMaterials';
import { getAllSyncOperations } from '../group-d/offline/indexedDB';
import { syncPendingChanges } from '../group-d/offline/sync';
import { isReaderConnected, lorisApi, openInReader, ReaderNotConnectedError } from '../integration/loris';
import { getMaterialKind, isAccessValid } from '../types/offline';

const LAST_SYNC_KEY = 'loris:lastSyncedAt';

export type SyncState = 'idle' | 'syncing';

export interface StorageSummary {
  usedBytes: number;
  quotaBytes?: number;
  byKind: { epub: number; pdf: number; media: number };
}

function readLastSynced(): Date | null {
  try {
    const v = localStorage.getItem(LAST_SYNC_KEY);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

export function useOfflineLibrary() {
  const { isOnline } = useNetworkStatus();
  const [items, setItems] = useState<OfflineMaterialMetadata[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageSummary>({ usedBytes: 0, byKind: { epub: 0, pdf: 0, media: 0 } });
  const [pending, setPending] = useState(0);
  const [needsAttention, setNeedsAttention] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(readLastSynced);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, usage, ops] = await Promise.all([
        listOfflineMaterials(),
        getOfflineStorageUsage(),
        getAllSyncOperations(),
      ]);
      list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      const byKind = { epub: 0, pdf: 0, media: 0 };
      for (const m of list) {
        const k = getMaterialKind(m);
        if (k === 'epub') byKind.epub += m.fileSize;
        else if (k === 'audio' || k === 'video') byKind.media += m.fileSize;
        else byKind.pdf += m.fileSize;
      }
      setItems(list);
      setStorage({ usedBytes: usage.usedBytes, quotaBytes: usage.quotaBytes, byKind });
      setPending(ops.filter((o) => o.status === 'pending').length);
      setNeedsAttention(ops.filter((o) => o.status === 'failed').length);
      setLastVerifiedAt(new Date());
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the offline library.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = useCallback(async () => {
    setSyncState('syncing');
    setSyncMessage(null);
    try {
      const r = await syncPendingChanges(lorisApi.sendSyncBatch);
      if (r.failed === 0) {
        const now = new Date();
        try { localStorage.setItem(LAST_SYNC_KEY, now.toISOString()); } catch { /* storage unavailable */ }
        setLastSyncedAt(now);
      }
      const parts: string[] = [];
      if (r.synced) parts.push(`${r.synced} synced`);
      if (r.conflicts) parts.push(`${r.conflicts} conflict${r.conflicts > 1 ? 's' : ''}`);
      if (r.forbidden) parts.push(`${r.forbidden} not permitted`);
      if (r.failed) parts.push(`${r.failed} failed – will retry`);
      setSyncMessage(parts.length ? parts.join(' · ') : 'Everything is up to date');
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : 'Synchronisation failed.');
    } finally {
      setSyncState('idle');
      await refresh();
    }
  }, [refresh]);

  // Try to sync once when connectivity returns (README: "when the browser returns online").
  const wasOnline = useRef(isOnline);
  useEffect(() => {
    if (isOnline && !wasOnline.current && pending > 0) void sync();
    wasOnline.current = isOnline;
  }, [isOnline, pending, sync]);

  const remove = useCallback(async (id: string) => {
    await removeOfflineMaterial(id);
    await refresh();
  }, [refresh]);

  const purgeAll = useCallback(async () => {
    await Promise.all(items.map((m) => removeOfflineMaterial(m.id)));
    await refresh();
  }, [items, refresh]);

  /** Checks offline-access expiry, then hands the stored file to Group C's reader. */
  const open = useCallback(async (id: string) => {
    const record = await getOfflineMaterial(id); // throws if offline access has expired
    if (!record) throw new Error('This material is no longer stored on this device.');
    if (!isReaderConnected()) {
      throw new ReaderNotConnectedError('Access verified, but the LORIS reader (Group C) is not connected yet, so the file cannot be opened.');
    }
    openInReader({ metadata: record.metadata, objectUrl: URL.createObjectURL(record.fileBlob) });
  }, []);

  const readyCount = useMemo(() => items.filter((m) => isAccessValid(m)).length, [items]);
  const healthPercent = items.length ? Math.round((readyCount / items.length) * 100) : 100;

  return {
    isOnline, items, status, error, storage, pending, needsAttention, syncState, syncMessage,
    lastSyncedAt, lastVerifiedAt, readyCount, healthPercent, refresh, sync, remove, purgeAll, open,
  };
}
