export type MaterialId = string;

export interface OfflineMaterialMetadata {
  id: MaterialId;
  title: string;
  author?: string;
  category?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sourceUrl?: string;
  savedAt: string;
  lastOpenedAt?: string;
  /** Server-issued timestamp after which offline access must be denied. */
  offlineAllowedUntil: string;
  organisationId?: string;
  ownerUserId: string;
  /** Optional display fields used by the Offline Library UI. */
  coverUrl?: string;
  pageCount?: number;
  durationSeconds?: number;
  /** Short reading/listening status supplied by Group C, e.g. "Page 42 of 248". */
  progressLabel?: string;
}

export interface OfflineMaterialRecord {
  metadata: OfflineMaterialMetadata;
  fileBlob: Blob;
}

export type SyncEntity = "bookmark" | "note" | "highlight" | "reading-progress";

export interface SyncOperation {
  operationId: string;
  entity: SyncEntity;
  action: "upsert" | "delete";
  materialId: MaterialId;
  payload: Record<string, unknown>;
  clientUpdatedAt: string;
  attempts: number;
  createdAt: string;
  status: "pending" | "failed";
  lastError?: string;
}

export interface OfflinePermission {
  allowed: boolean;
  reason?: string;
  offlineAllowedUntil?: string;
  validatedAt?: string;
}

export interface SyncOperationResult {
  operationId: string;
  status: "synced" | "conflict" | "forbidden" | "failed";
  message?: string;
}

export interface SyncResponse {
  results: SyncOperationResult[];
}
