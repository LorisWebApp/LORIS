/**
 * Group C – Reader content service.
 *
 * Supplies the Reader with a ReaderDocument,
 * either online or from an encrypted offline copy.
 *
 * API CONTRACT:
 * GET /api/materials/:id/reader-document -> ReaderDocument
 *
 * The backend must verify that the authenticated user
 * has permission to access the requested material.
 *
 * Offline documents are stored as encrypted JSON in IndexedDB.
 * PDF and EPUB parsing is not implemented yet.
 */

import type { ReaderDocument } from "../types/reader.types";

import { OfflineAccessError, readOfflineBytes } from "./offline/offlineStorage";

import { apiRequest } from "./userApi";

export interface LoadedDocument {
  doc: ReaderDocument;
  source: "online" | "offline";
}

/**
 * Determines whether an error was caused by a network failure.
 *
 * HTTP errors such as 403 and 404 must not be bypassed
 * by loading an offline copy.
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    return (error as { status: unknown }).status === 0;
  }

  return false;
}

/** Validates the minimum required ReaderDocument structure. */
function isValidDocument(
  value: unknown,
  materialId: string,
): value is ReaderDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const document = value as Partial<ReaderDocument>;

  return (
    document.id === materialId &&
    Array.isArray(document.pages) &&
    document.pages.length > 0 &&
    Array.isArray(document.chapters)
  );
}

/** Reads and validates an encrypted offline document. */
async function fromOffline(materialId: string): Promise<ReaderDocument> {
  const bytes = await readOfflineBytes(materialId);

  let decoded: string;

  try {
    decoded = new TextDecoder().decode(bytes);
  } catch {
    throw new Error("The saved document could not be decoded.");
  }

  let document: unknown;

  try {
    document = JSON.parse(decoded);
  } catch {
    throw new Error("The saved document contains invalid data.");
  }

  if (!isValidDocument(document, materialId)) {
    throw new Error("The saved document is invalid or damaged.");
  }

  return document;
}

/** Retrieves a document for the Reader. */
export async function getReaderDocument(
  materialId: string,
): Promise<LoadedDocument> {
  const id = materialId.trim();

  if (!id) {
    throw new Error("A valid material ID is required.");
  }

  const isOnline = typeof navigator === "undefined" || navigator.onLine;

  // ONLINE
  if (isOnline) {
    try {
      const document = await apiRequest<ReaderDocument>(
        `/materials/${encodeURIComponent(id)}/reader-document`,
      );

      if (!isValidDocument(document, id)) {
        throw new Error("The server returned an invalid reading document.");
      }

      return {
        doc: document,
        source: "online",
      };
    } catch (error) {
      // Do not use an offline copy to bypass access restrictions
      // or hide a server response such as 403 or 404.
      if (!isNetworkError(error)) {
        throw error;
      }

      // The network failed. Try the encrypted offline copy.
      try {
        return {
          doc: await fromOffline(id),
          source: "offline",
        };
      } catch {
        throw error;
      }
    }
  }

  // OFFLINE
  try {
    return {
      doc: await fromOffline(id),
      source: "offline",
    };
  } catch (error) {
    if (error instanceof OfflineAccessError && error.reason === "expired") {
      throw new Error(
        "Your offline access to this title has expired. Reconnect to the internet to renew it.",
      );
    }

    throw new Error(
      "You’re offline and this title isn’t available on this device. Download it from the Offline Library while online.",
    );
  }
}
