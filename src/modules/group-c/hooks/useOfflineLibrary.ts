import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OFFLINE_STORAGE_ALLOCATION_BYTES } from "../config/offlinePolicy";
import { getLibrary } from "../services/library.service";
import {
  downloadMaterial,
  listOfflineMeta,
  metaStatus,
  removeOfflineMaterial,
  renewOfflineAccess,
  type OfflineMeta,
} from "../services/offline/offlineStorage";
import {
  flushSyncQueue,
  getPendingCount,
  onQueueChange,
} from "../services/offline/sync";
import type { ActionResult } from "../types/reader.types";
import type { LibraryMaterial } from "../types/userLibrary.types";
import { useNetworkStatus } from "./useNetworkStatus";

export interface OfflineItem {
  material: LibraryMaterial;
  sizeBytes: number;
  downloadedAt?: string;
  expiresAt?: string;
  status: "ready" | "expired" | "downloading" | "failed";
  progress?: number;
  error?: string;
}

interface ActiveDownload {
  material: LibraryMaterial;
  progress: number;
  error?: string;
}

const PREFS_KEY = "groupc.offlinePrefs";

export interface OfflinePrefs {
  autoDownload: boolean;
  wifiOnly: boolean;
}

const DEFAULT_PREFS: OfflinePrefs = {
  autoDownload: false,
  wifiOnly: true,
};

const readPrefs = (): OfflinePrefs => {
  try {
    const saved = localStorage.getItem(PREFS_KEY);

    if (!saved) return DEFAULT_PREFS;

    return {
      ...DEFAULT_PREFS,
      ...(JSON.parse(saved) as Partial<OfflinePrefs>),
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

/**
 * Checks whether the browser reports a cellular connection.
 * Not all browsers support the Network Information API.
 */
const onCellular = (): boolean => {
  const connection = (
    navigator as Navigator & {
      connection?: { type?: string };
    }
  ).connection;

  return connection?.type === "cellular";
};

/** Offline Library state: stored titles, downloads in flight, storage usage, pending sync and preferences. */
export function useOfflineLibrary() {
  const online = useNetworkStatus();

  const [metas, setMetas] = useState<OfflineMeta[]>([]);
  const [active, setActive] = useState<Record<string, ActiveDownload>>({});
  const [pending, setPending] = useState(0);
  const [candidates, setCandidates] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [prefs, setPrefs] = useState<OfflinePrefs>(readPrefs);

  const wasOnline = useRef(online);

  const refresh = useCallback(async () => {
    try {
      const [offlineMeta, pendingCount] = await Promise.all([
        listOfflineMeta(),
        getPendingCount(),
      ]);

      setMetas(offlineMeta);
      setPending(pendingCount);
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Offline storage is not available.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    return onQueueChange(() => {
      void refresh();
    });
  }, [refresh]);

  // Load favourited materials that are available to download.
  useEffect(() => {
    if (!online) {
      setCandidates([]);
      return;
    }

    let cancelled = false;

    getLibrary()
      .then((library) => {
        if (!cancelled) {
          setCandidates(library.favourites);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCandidates([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [online]);

  const items = useMemo<OfflineItem[]>(() => {
    const stored: OfflineItem[] = metas
      .filter((meta) => !active[meta.id])
      .map((meta) => ({
        material: meta.material,
        sizeBytes: meta.sizeBytes,
        downloadedAt: meta.downloadedAt,
        expiresAt: meta.expiresAt,
        status: metaStatus(meta),
      }));

    const inFlight: OfflineItem[] = Object.values(active).map((item) => ({
      material: item.material,
      sizeBytes: item.material.fileSizeBytes ?? 0,
      status: item.error ? "failed" : "downloading",
      progress: item.progress,
      error: item.error,
    }));

    return [...inFlight, ...stored];
  }, [metas, active]);

  const download = useCallback(
    async (material: LibraryMaterial): Promise<ActionResult> => {
      if (!navigator.onLine) {
        return {
          ok: false,
          message: "Connect to the internet to download titles.",
        };
      }

      setActive((current) => ({
        ...current,
        [material.id]: {
          material,
          progress: 0,
        },
      }));

      try {
        await downloadMaterial(material, (progress) => {
          setActive((current) => {
            if (!current[material.id]) return current;

            return {
              ...current,
              [material.id]: {
                material,
                progress,
              },
            };
          });
        });

        setActive((current) => {
          const { [material.id]: completed, ...remaining } = current;
          void completed;
          return remaining;
        });

        await refresh();

        return {
          ok: true,
          message: `“${material.title}” is ready to read offline.`,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The download failed.";

        setActive((current) => ({
          ...current,
          [material.id]: {
            material,
            progress: 0,
            error: message,
          },
        }));

        return {
          ok: false,
          message,
        };
      }
    },
    [refresh],
  );

  const dismissFailed = useCallback((materialId: string) => {
    setActive((current) => {
      const { [materialId]: dismissed, ...remaining } = current;
      void dismissed;
      return remaining;
    });
  }, []);

  const remove = useCallback(
    async (materialId: string): Promise<ActionResult> => {
      try {
        await removeOfflineMaterial(materialId);
        await refresh();

        return {
          ok: true,
          message: "Removed from this device.",
        };
      } catch {
        return {
          ok: false,
          message: "We couldn’t remove that title.",
        };
      }
    },
    [refresh],
  );

  /**
   * Removes downloaded materials without deleting queued changes.
   * Pending bookmarks, notes and other changes remain available for syncing.
   */
  const clearAll = useCallback(async (): Promise<ActionResult> => {
    try {
      const storedMaterials = await listOfflineMeta();

      await Promise.all(
        storedMaterials.map((item) => removeOfflineMaterial(item.id)),
      );

      await refresh();

      return {
        ok: true,
        message: "Offline storage cleared.",
      };
    } catch {
      return {
        ok: false,
        message: "We couldn’t clear offline storage.",
      };
    }
  }, [refresh]);

  /** Replays queued changes and renews offline access. */
  const syncNow = useCallback(async (): Promise<ActionResult> => {
    if (!navigator.onLine) {
      return {
        ok: false,
        message: "You’re offline. Changes will sync when you reconnect.",
      };
    }

    setSyncing(true);

    try {
      const result = await flushSyncQueue();
      const renewed = await renewOfflineAccess();

      await refresh();

      if (result.failed > 0) {
        return {
          ok: false,
          message: `${result.failed} ${
            result.failed === 1 ? "change" : "changes"
          } couldn’t sync yet. We’ll retry automatically.`,
        };
      }

      const parts = [
        result.synced > 0
          ? `${result.synced} ${
              result.synced === 1 ? "change" : "changes"
            } synced`
          : "Everything is up to date",
        renewed > 0 ? "offline access renewed" : "",
      ];

      const message =
        parts.filter(Boolean).join(" · ") +
        (result.conflicts
          ? ` · ${result.conflicts} resolved in favour of the server`
          : "") +
        ".";

      return {
        ok: true,
        message,
      };
    } catch {
      return {
        ok: false,
        message: "Sync failed. Please try again.",
      };
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  // Automatically sync when the browser reconnects.
  useEffect(() => {
    if (online && !wasOnline.current) {
      void syncNow();
    }

    wasOnline.current = online;
  }, [online, syncNow]);

  // Automatically download favourites when enabled.
  useEffect(() => {
    if (
      !prefs.autoDownload ||
      !online ||
      loading ||
      (prefs.wifiOnly && onCellular())
    ) {
      return;
    }

    const savedIds = new Set(metas.map((meta) => meta.id));

    const next = candidates.find(
      (material) => !savedIds.has(material.id) && !active[material.id],
    );

    if (next) {
      void download(next);
    }
  }, [prefs, online, loading, metas, candidates, active, download]);

  const updatePrefs = useCallback((patch: Partial<OfflinePrefs>) => {
    setPrefs((current) => {
      const next = {
        ...current,
        ...patch,
      };

      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // Ignore unavailable storage.
      }

      return next;
    });
  }, []);

  const usedBytes = metas.reduce((total, meta) => total + meta.sizeBytes, 0);

  const savedIds = useMemo(
    () => new Set(metas.map((meta) => meta.id)),
    [metas],
  );

  const validExpiryDates = metas
    .map((meta) => new Date(meta.expiresAt).getTime())
    .filter((date) => Number.isFinite(date));

  const nextExpiry = validExpiryDates.length
    ? Math.min(...validExpiryDates)
    : null;

  return {
    online,
    loading,
    storageError,
    items,
    candidates: candidates.filter(
      (material) => !savedIds.has(material.id) && !active[material.id],
    ),
    usedBytes,
    allocationBytes: OFFLINE_STORAGE_ALLOCATION_BYTES,
    nextExpiry,
    pending,
    syncing,
    prefs,
    updatePrefs,
    download,
    dismissFailed,
    remove,
    clearAll,
    syncNow,
  };
}
