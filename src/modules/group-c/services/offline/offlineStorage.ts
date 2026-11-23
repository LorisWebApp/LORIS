/**
 * LORIS Offline Library Storage
 *
 * Responsibilities:
 * - Download reading materials
 * - Encrypt files before storing them
 * - Save download metadata
 * - Check offline licence expiry
 * - Renew offline access
 * - Remove downloaded materials
 *
 * Actual material files are stored in IndexedDB, not PostgreSQL.
 */


import type { LibraryMaterial } from "../../types/userLibrary.types";

import { clearUserCaches } from "../userCrud";
import { API_BASE_URL, apiRequest, getAccessToken } from "../userApi";

import {
  decryptBytes,
  encryptBytes,
  type EncryptedBlob,
} from "./offlineEncryption";

import { idbClear, idbDelete, idbGet, idbGetAll, idbPut } from "./indexedDB";

/**
 * Metadata saved for every downloaded material.
 */
export interface OfflineMeta {
  id: string;
  material: LibraryMaterial;
  sizeBytes: number;
  downloadedAt: string;
  expiresAt: string;
}

export type OfflineStatus = "ready" | "expired";

/**
 * Error returned when an offline material cannot be accessed.
 */
export class OfflineAccessError extends Error {
  readonly reason: "expired" | "missing";

  constructor(reason: "expired" | "missing") {
    super(
      reason === "expired"
        ? "Offline access has expired."
        : "This title is not saved on this device.",
    );

    this.name = "OfflineAccessError";
    this.reason = reason;
  }
}

/**
 * Determines whether an offline licence is still valid.
 */
export const metaStatus = (
  meta: OfflineMeta,
  now = Date.now(),
): OfflineStatus => {
  const expiry = new Date(meta.expiresAt).getTime();

  if (!Number.isFinite(expiry) || expiry <= now) {
    return "expired";
  }

  return "ready";
};

/**
 * Returns all downloaded material metadata.
 */
export const listOfflineMeta = (): Promise<OfflineMeta[]> => {
  return idbGetAll<OfflineMeta>("meta");
};

/**
 * Reads and decrypts a downloaded material.
 */
export async function readOfflineBytes(
  materialId: string,
): Promise<ArrayBuffer> {
  const meta = await idbGet<OfflineMeta>("meta", materialId);

  const file = await idbGet<EncryptedBlob & { id: string }>(
    "files",
    materialId,
  );

  if (!meta || !file) {
    throw new OfflineAccessError("missing");
  }

  if (metaStatus(meta) === "expired") {
    throw new OfflineAccessError("expired");
  }

  return decryptBytes(file);
}

/**
 * Removes a downloaded material and its metadata.
 */
export async function removeOfflineMaterial(materialId: string): Promise<void> {
  await Promise.all([
    idbDelete("files", materialId),
    idbDelete("meta", materialId),
  ]);
}

/**
 * Clears all offline data.
 *
 * Used when:
 * - A user signs out
 * - The user selects Clear Offline Storage
 *
 * Note: Encryption key cleanup and sync queue cleanup
 * will be finalized after reviewing their implementations.
 */
export async function clearAllOfflineData(): Promise<void> {
  await Promise.all([
    idbClear("meta"),
    idbClear("files"),
    idbClear("keys"),
    idbClear("syncQueue"),
  ]);

  clearUserCaches();
}

/**
 * Downloads, encrypts and stores a material.
 *
 * onProgress reports download progress from 0 to 100.
 */
export async function downloadMaterial(
  material: LibraryMaterial,
  onProgress: (percent: number) => void,
): Promise<OfflineMeta> {
  let bytes: ArrayBuffer;
  let sizeBytes: number;
  let expiresAt: string;

  // A real backend grant is required; no simulated documents or licence dates are created.
    const grant = await apiRequest<{
      url: string;
      sizeBytes: number;
      expiresAt: string;
    }>(`/offline/materials/${encodeURIComponent(material.id)}/download`, {
      method: "POST",
    });

    // The file endpoint is authenticated; the grant URL alone is not enough.
    const accessToken = await getAccessToken();
    // The server builds grant.url from its own host/protocol, which is wrong
    // behind a proxy or HTTPS (blocked as a network error). Keep only the path
    // and resolve it against the API base this app is configured with.
    const grantPath = (() => {
      try {
        return new URL(grant.url, window.location.origin).pathname.replace(/^\/api(?=\/)/, "");
      } catch {
        return `/materials/${encodeURIComponent(material.id)}/file`;
      }
    })();

    // Never request plain http from an https page (browsers block it as mixed content).
    let fileUrl = `${API_BASE_URL}${grantPath}`;
    if (window.location.protocol === "https:") {
      fileUrl = fileUrl.replace(/^http:\/\//i, "https://");
    }

    const response = await fetch(fileUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    if (!response.ok || !response.body) {
      throw new Error("The file could not be downloaded.");
    }

    const reader = response.body.getReader();

    const chunks: Uint8Array[] = [];

    let received = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          received += value.length;

          const progress = Math.min(
            99,
            Math.round((received / (grant.sizeBytes || received || 1)) * 100),
          );

          onProgress(progress);
        }
      }
    } catch (error) {
      await reader.cancel().catch(() => undefined);
      throw error;
    }

    const merged = new Uint8Array(received);

    let offset = 0;

    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    bytes = merged.buffer;

    sizeBytes = grant.sizeBytes || received;

    expiresAt = grant.expiresAt;

    if (
      !Number.isFinite(new Date(expiresAt).getTime()) ||
      new Date(expiresAt).getTime() <= Date.now()
    ) {
      throw new Error("The offline access licence is invalid.");
    }

  // ENCRYPT AND SAVE
  try {
    const encrypted = await encryptBytes(bytes);

    const meta: OfflineMeta = {
      id: material.id,
      material,
      sizeBytes,
      downloadedAt: new Date().toISOString(),
      expiresAt,
    };

    await idbPut("files", {
      id: material.id,
      ...encrypted,
    });

    try {
      await idbPut("meta", meta);
    } catch (error) {
      // Avoid leaving an encrypted file without matching metadata.
      await idbDelete("files", material.id);
      throw error;
    }

    onProgress(100);

    return meta;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("There isn’t enough free storage on this device.");
    }

    throw error;
  }
}

/**
 * Renews the offline licence for all downloaded materials.
 *
 * Requires an internet connection when real API mode is enabled.
 */
export async function renewOfflineAccess(): Promise<number> {
  const materials = await listOfflineMeta();

  if (materials.length === 0) {
    return 0;
  }

  const expiresAt = (await apiRequest<{ expiresAt: string }>("/offline/renew", {
    method: "POST",
    body: JSON.stringify({ materialIds: materials.map((m) => m.id) }),
  })).expiresAt;

  if (
    !Number.isFinite(new Date(expiresAt).getTime()) ||
    new Date(expiresAt).getTime() <= Date.now()
  ) {
    throw new Error("The renewed offline licence is invalid.");
  }

  await Promise.all(
    materials.map((material) =>
      idbPut("meta", {
        ...material,
        expiresAt,
      }),
    ),
  );

  return materials.length;
}
