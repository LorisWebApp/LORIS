import { useCallback, useEffect, useMemo, useState } from "react";
import { setFavourite } from "../services/favourites.service";
import { getLibrary } from "../services/library.service";
import {
  listOfflineMeta,
  metaStatus,
} from "../services/offline/offlineStorage";
import { notesService } from "../services/notes.service";
import type {
  ActionResult,
  LibraryOverview,
  Note,
} from "../types/reader.types";
import type {
  LibraryMaterial,
  ReadingProgressSummary,
} from "../types/userLibrary.types";

export interface LibraryItem {
  material: LibraryMaterial;
  progress?: ReadingProgressSummary;
  isFavourite: boolean;
  isOffline: boolean;
  completed: boolean;
}

/** My Library: favourites and reading history merged into one searchable list, plus recent notes. */
export function useMyLibrary() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [overview, setOverview] = useState<LibraryOverview | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [offlineIds, setOfflineIds] = useState<ReadonlySet<string>>(new Set());
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [noteCount, setNoteCount] = useState(0);

  const load = useCallback(async () => {
    setState("loading");

    try {
      const [library, notes, offlineMeta] = await Promise.all([
        getLibrary(),
        notesService.list().catch(() => [] as Note[]),
        listOfflineMeta().catch(() => []),
      ]);

      setOverview(library);

      setFavouriteIds(
        new Set(library.favourites.map((material) => material.id)),
      );

      setOfflineIds(
        new Set(
          offlineMeta
            .filter((meta) => metaStatus(meta) === "ready")
            .map((meta) => meta.id),
        ),
      );

      setNoteCount(notes.length);

      setRecentNotes(
        [...notes]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 3),
      );

      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo<LibraryItem[]>(() => {
    if (!overview) return [];

    const map = new Map<string, LibraryItem>();

    const add = (
      material: LibraryMaterial,
      progress?: ReadingProgressSummary,
      completed = false,
    ) => {
      const existing = map.get(material.id);

      map.set(material.id, {
        material,
        progress: progress ?? existing?.progress,
        completed: completed || (existing?.completed ?? false),
        isFavourite: favouriteIds.has(material.id),
        isOffline: offlineIds.has(material.id),
      });
    };

    overview.inProgress.forEach((entry) => {
      add(entry.material, entry.progress);
    });

    overview.completed.forEach((entry) => {
      add(entry.material, entry.progress, true);
    });

    overview.favourites.forEach((material) => {
      add(material);
    });

    return [...map.values()];
  }, [overview, favouriteIds, offlineIds]);

  const toggleFavourite = useCallback(
    async (
      materialId: string,
    ): Promise<ActionResult & { favourite: boolean }> => {
      const previous = favouriteIds.has(materialId);
      const next = !previous;

      setFavouriteIds((current) => {
        const updated = new Set(current);

        if (next) {
          updated.add(materialId);
        } else {
          updated.delete(materialId);
        }

        return updated;
      });

      try {
        await setFavourite(materialId, next);

        return {
          ok: true,
          favourite: next,
          message: next
            ? "Added to your favourites."
            : "Removed from your favourites.",
        };
      } catch {
        setFavouriteIds((current) => {
          const updated = new Set(current);

          if (previous) {
            updated.add(materialId);
          } else {
            updated.delete(materialId);
          }

          return updated;
        });

        return {
          ok: false,
          favourite: previous,
          message: "We couldn’t update your favourites. Please try again.",
        };
      }
    },
    [favouriteIds],
  );

  return {
    state,
    items,
    favouriteIds,
    recentNotes,
    noteCount,
    reload: load,
    toggleFavourite,
  };
}
