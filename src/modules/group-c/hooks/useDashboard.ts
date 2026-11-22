import { useCallback, useEffect, useRef, useState } from "react";

import { fetchDashboard } from "../services/dashboard.service";

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

/** Loads dashboard data and manages dashboard actions. */
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    status: "loading",
  });

  const [favouriteIds, setFavouriteIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const requestId = useRef(0);

  // Keep the latest favourite state available to asynchronous actions.
  const favouriteIdsRef = useRef<Set<string>>(new Set());

  // Prevent duplicate requests for the same material.
  const favouriteRequests = useRef<Set<string>>(new Set());

  // Prevent duplicate removal requests.

  const load = useCallback(async () => {
    const id = ++requestId.current;

    setState({ status: "loading" });

    try {
      const data = await fetchDashboard();

      if (id !== requestId.current) {
        return;
      }

      const nextFavouriteIds = new Set(data.favouriteIds);

      favouriteIdsRef.current = nextFavouriteIds;
      setFavouriteIds(nextFavouriteIds);

      setState({
        status: "ready",
        data,
      });
    } catch (error) {
      if (id !== requestId.current) {
        return;
      }

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
      requestId.current += 1;
    };
  }, [load]);

  const patchReady = useCallback(
    (patch: (data: DashboardData) => DashboardData) => {
      setState((current) =>
        current.status === "ready"
          ? {
              status: "ready",
              data: patch(current.data),
            }
          : current,
      );
    },
    [],
  );

  const adjustFavouriteCount = useCallback(
    (delta: number) => {
      patchReady((data) => ({
        ...data,
        counts: {
          ...data.counts,
          favourites: Math.max(0, data.counts.favourites + delta),
        },
      }));
    },
    [patchReady],
  );

  /**
   * Optimistically updates the favourite state.
   * Reverts the change if the service request fails.
   */
  const toggleFavourite = useCallback(
    async (materialId: string): Promise<ActionResult> => {
      if (favouriteRequests.current.has(materialId)) {
        return {
          ok: false,
          favourite: favouriteIdsRef.current.has(materialId),
        };
      }

      favouriteRequests.current.add(materialId);

      const previous = favouriteIdsRef.current.has(materialId);
      const next = !previous;

      const updatedIds = new Set(favouriteIdsRef.current);

      if (next) {
        updatedIds.add(materialId);
      } else {
        updatedIds.delete(materialId);
      }

      favouriteIdsRef.current = updatedIds;
      setFavouriteIds(updatedIds);

      adjustFavouriteCount(next ? 1 : -1);

      try {
        await setFavourite(materialId, next);

        return {
          ok: true,
          favourite: next,
        };
      } catch {
        const rollbackIds = new Set(favouriteIdsRef.current);

        if (previous) {
          rollbackIds.add(materialId);
        } else {
          rollbackIds.delete(materialId);
        }

        favouriteIdsRef.current = rollbackIds;
        setFavouriteIds(rollbackIds);

        adjustFavouriteCount(previous ? 1 : -1);

        return {
          ok: false,
          favourite: next,
        };
      } finally {
        favouriteRequests.current.delete(materialId);
      }
    },
    [adjustFavouriteCount],
  );

  return {
    state,
    favouriteIds,
    reload: load,
    toggleFavourite,
  };
}
