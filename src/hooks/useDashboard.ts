import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchDashboard,
  removeOfflineDownload,
} from "../services/dashboard.service";
import { setFavourite } from "../services/favourites.service";
import type { DashboardData } from "../types/userLibrary.types";

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

export interface ActionResult {
  ok: boolean;
  /** For favourites: the state the user asked for. */
  favourite?: boolean;
}

/** Loads the Dashboard and owns its mutations (favourite toggle, remove offline copy). */
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [favouriteIds, setFavouriteIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState({ status: "loading" });
    try {
      const data = await fetchDashboard();
      if (id !== requestId.current) return;
      setFavouriteIds(new Set(data.favouriteIds));
      setState({ status: "ready", data });
    } catch (error) {
      if (id !== requestId.current) return;
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1; // ignore responses that arrive after unmount
    };
  }, [load]);

  const patchReady = useCallback(
    (patch: (data: DashboardData) => DashboardData) => {
      setState((current) =>
        current.status === "ready"
          ? { status: "ready", data: patch(current.data) }
          : current,
      );
    },
    [],
  );

  const adjustFavouriteCount = useCallback(
    (delta: number) =>
      patchReady((data) => ({
        ...data,
        counts: {
          ...data.counts,
          favourites: Math.max(0, data.counts.favourites + delta),
        },
      })),
    [patchReady],
  );

  /** Optimistic: flips immediately, rolls back if the request fails. */
  const toggleFavourite = useCallback(
    async (materialId: string): Promise<ActionResult> => {
      const next = !favouriteIds.has(materialId);
      const apply = (on: boolean) =>
        setFavouriteIds((prev) => {
          const copy = new Set(prev);
          if (on) copy.add(materialId);
          else copy.delete(materialId);
          return copy;
        });

      apply(next);
      adjustFavouriteCount(next ? 1 : -1);
      try {
        await setFavourite(materialId, next);
        return { ok: true, favourite: next };
      } catch {
        apply(!next);
        adjustFavouriteCount(next ? -1 : 1);
        return { ok: false, favourite: next };
      }
    },
    [favouriteIds, adjustFavouriteCount],
  );

  const removeDownload = useCallback(
    async (downloadId: string): Promise<ActionResult> => {
      if (state.status !== "ready") return { ok: false };
      const download = state.data.offline.downloads.find(
        (d) => d.id === downloadId,
      );
      if (!download) return { ok: false };
      try {
        await removeOfflineDownload(downloadId);
      } catch {
        return { ok: false };
      }
      patchReady((data) => {
        const materialId = download.material.id;
        const clearOffline = (entry: DashboardData["shelf"][number]) =>
          entry.material.id === materialId
            ? { ...entry, isOffline: false }
            : entry;
        return {
          ...data,
          offline: {
            downloads: data.offline.downloads.filter(
              (d) => d.id !== downloadId,
            ),
          },
          stats: {
            ...data.stats,
            offlineReady: Math.max(
              0,
              data.stats.offlineReady - (download.status === "ready" ? 1 : 0),
            ),
          },
          shelf: data.shelf.map(clearOffline),
          currentlyReading: data.currentlyReading
            ? clearOffline(data.currentlyReading)
            : null,
        };
      });
      return { ok: true };
    },
    [state, patchReady],
  );

  return { state, favouriteIds, reload: load, toggleFavourite, removeDownload };
}
