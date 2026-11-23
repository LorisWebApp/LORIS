import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAuth } from "../../../group-a/contexts/AuthContext";
import { getAccessToken } from "../../../../integration/loris";
import { pathOf, toHttps } from "../../../../lib/secureUrl";
import {
  listOfflineMaterials,
  removeOfflineMaterial,
  saveMaterialForOffline,
} from "../../../../group-d/offline/offlineMaterials";
import type { ActionResult } from "../../types/reader.types";
import type { LibraryMaterial, MaterialFormat } from "../../types/userLibrary.types";

interface OfflineActions {
  savedIds: ReadonlySet<string>;
  downloadingIds: ReadonlySet<string>;
  toggle: (material: LibraryMaterial) => Promise<ActionResult>;
}

const MIME_BY_FORMAT: Record<MaterialFormat, string> = {
  PDF: "application/pdf",
  EPUB: "application/epub+zip",
  MP3: "audio/mpeg",
  MP4: "video/mp4",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const OfflineActionsContext = createContext<OfflineActions | null>(null);

/**
 * One shared offline state for every "Save for offline" button. It uses the same Group D
 * store and download flow as the material details page, so a title saved from a card, the
 * reader or the details page all appear in the same Offline Library.
 */
export function OfflineActionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const items = await listOfflineMaterials();
      setSavedIds(new Set(items.map((item) => String(item.id))));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(timer.current);
    };
  }, [refresh]);

  const showToast = useCallback((ok: boolean, message: string) => {
    setToast({ ok, message });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), ok ? 3500 : 7000);
  }, []);

  const setBusy = (id: string, busy: boolean) =>
    setDownloadingIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggle = useCallback(
    async (material: LibraryMaterial): Promise<ActionResult> => {
      const id = String(material.id);

      const finish = (result: ActionResult) => {
        showToast(result.ok, result.message);
        return result;
      };

      if (savedIds.has(id)) {
        try {
          await removeOfflineMaterial(id);
          await refresh();
          return finish({ ok: true, message: "Removed from this device." });
        } catch {
          return finish({ ok: false, message: "We couldn’t remove that title." });
        }
      }

      if (!user) return finish({ ok: false, message: "Sign in to save materials offline." });
      if (!navigator.onLine) {
        return finish({ ok: false, message: "Connect to the internet to save this material offline." });
      }

      setBusy(id, true);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Sign in to save materials offline.");

        const apiBase = toHttps(
          ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").trim().replace(/\/+$/, ""),
        );
        if (!apiBase) throw new Error("The offline download service is not configured (VITE_API_BASE_URL).");

        const grantResponse = await fetch(
          `${apiBase}/api/offline/materials/${encodeURIComponent(id)}/download`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        );
        const grant = (await grantResponse.json().catch(() => ({}))) as {
          url?: string;
          sizeBytes?: number;
          expiresAt?: string;
          error?: string;
        };
        if (!grantResponse.ok || !grant.url || !grant.expiresAt) {
          throw new Error(grant.error || "The server could not authorise this offline download.");
        }

        // Re-base the server-issued URL on our API origin (behind a proxy it comes back as http://).
        const fileResponse = await fetch(toHttps(`${apiBase}${pathOf(grant.url)}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fileResponse.ok) throw new Error("The material file could not be downloaded.");
        const fileBlob = await fileResponse.blob();

        const extension = material.format.toLowerCase();
        await saveMaterialForOffline({
          material: {
            id,
            title: material.title,
            author: material.author ?? "",
            category: material.category || "General",
            fileName: `${material.title}.${extension}`,
            mimeType: MIME_BY_FORMAT[material.format] ?? fileBlob.type ?? "application/octet-stream",
            fileSize: fileBlob.size || Number(grant.sizeBytes ?? 0),
            ownerUserId: user.id,
            coverUrl: material.coverUrl ?? undefined,
            pageCount: material.pageCount,
          },
          fileBlob,
          permission: {
            allowed: true,
            offlineAllowedUntil: grant.expiresAt,
            validatedAt: new Date().toISOString(),
          },
        });

        await refresh();
        return finish({ ok: true, message: `“${material.title}” is saved for offline reading.` });
      } catch (error) {
        return finish({
          ok: false,
          message: error instanceof Error ? error.message : "Could not save this material offline.",
        });
      } finally {
        setBusy(id, false);
      }
    },
    [savedIds, user, refresh, showToast],
  );

  const value = useMemo(() => ({ savedIds, downloadingIds, toggle }), [savedIds, downloadingIds, toggle]);

  return (
    <OfflineActionsContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role={toast.ok ? "status" : "alert"}
          className={`fixed bottom-5 left-1/2 z-[90] flex max-w-[92vw] -translate-x-1/2 items-start gap-3 rounded-lg px-4 py-3 text-[15px] text-white shadow-lg ${
            toast.ok ? "bg-deep" : "bg-red-700"
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setToast(null)}
            className="shrink-0 font-semibold opacity-80 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </OfflineActionsContext.Provider>
  );
}

export function useOfflineActions(): OfflineActions | null {
  return useContext(OfflineActionsContext);
}
