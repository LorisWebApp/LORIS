import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { useOfflineLibrary } from "../../hooks/useOfflineLibrary";
import type { ActionResult } from "../../types/reader.types";
import type { LibraryMaterial } from "../../types/userLibrary.types";

interface OfflineActions {
  savedIds: ReadonlySet<string>;
  downloadingIds: ReadonlySet<string>;
  toggle: (material: LibraryMaterial) => Promise<ActionResult>;
}

const OfflineActionsContext = createContext<OfflineActions | null>(null);

/** One shared offline-library instance so every "Save" button agrees on state. */
export function OfflineActionsProvider({ children }: { children: ReactNode }) {
  const offline = useOfflineLibrary();

  const savedIds = useMemo(
    () => new Set(offline.items.filter((i) => i.status === "ready").map((i) => i.material.id)),
    [offline.items],
  );
  const downloadingIds = useMemo(
    () => new Set(offline.items.filter((i) => i.status === "downloading").map((i) => i.material.id)),
    [offline.items],
  );

  const { download, remove } = offline;
  const toggle = useCallback(
    (material: LibraryMaterial) =>
      savedIds.has(material.id) ? remove(material.id) : download(material),
    [savedIds, download, remove],
  );

  const value = useMemo(() => ({ savedIds, downloadingIds, toggle }), [savedIds, downloadingIds, toggle]);
  return <OfflineActionsContext.Provider value={value}>{children}</OfflineActionsContext.Provider>;
}

export function useOfflineActions(): OfflineActions | null {
  return useContext(OfflineActionsContext);
}
