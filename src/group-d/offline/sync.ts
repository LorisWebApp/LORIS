import type { SyncEntity, SyncOperation, SyncResponse } from "../types/models";
import {
  deleteSyncOperation,
  getPendingSyncOperations,
  putSyncOperation,
  updateSyncOperation,
} from "./indexedDB";

export interface QueueChangeInput {
  entity: SyncEntity;
  action: "upsert" | "delete";
  materialId: string;
  payload: Record<string, unknown>;
}

export interface SyncSender {
  (operations: SyncOperation[]): Promise<SyncResponse>;
}

export async function queueOfflineChange(input: QueueChangeInput): Promise<string> {
  const operationId = crypto.randomUUID();
  const now = new Date().toISOString();

  const operation: SyncOperation = {
    operationId,
    entity: input.entity,
    action: input.action,
    materialId: input.materialId,
    payload: input.payload,
    clientUpdatedAt: now,
    attempts: 0,
    createdAt: now,
    status: "pending",
  };

  await putSyncOperation(operation);
  return operationId;
}

export async function syncPendingChanges(
  sender: SyncSender,
  batchSize = 25
): Promise<{ synced: number; conflicts: number; forbidden: number; failed: number }> {
  if (!navigator.onLine) {
    throw new Error("LORIS is offline. Pending changes will sync when connectivity returns.");
  }

  const pending = await getPendingSyncOperations();
  const batch = pending.slice(0, Math.max(1, batchSize));

  if (batch.length === 0) {
    return { synced: 0, conflicts: 0, forbidden: 0, failed: 0 };
  }

  let response: SyncResponse;
  try {
    response = await sender(batch);
  } catch (error) {
    for (const operation of batch) {
      await updateSyncOperation({
        ...operation,
        attempts: operation.attempts + 1,
        lastError: error instanceof Error ? error.message : "Unknown sync error",
      });
    }
    throw error;
  }

  const counts = { synced: 0, conflicts: 0, forbidden: 0, failed: 0 };
  const resultsById = new Map(response.results.map((result) => [result.operationId, result]));

  for (const operation of batch) {
    const result = resultsById.get(operation.operationId);

    if (!result || result.status === "failed") {
      counts.failed += 1;
      await updateSyncOperation({
        ...operation,
        attempts: operation.attempts + 1,
        lastError: result?.message ?? "The server did not return a result for this operation.",
      });
      continue;
    }

    if (result.status === "synced") {
      counts.synced += 1;
      await deleteSyncOperation(operation.operationId);
    } else if (result.status === "conflict") {
      counts.conflicts += 1;
      await updateSyncOperation({
        ...operation,
        status: "failed",
        attempts: operation.attempts + 1,
        lastError: result.message ?? "A sync conflict requires resolution.",
      });
    } else if (result.status === "forbidden") {
      counts.forbidden += 1;
      await updateSyncOperation({
        ...operation,
        status: "failed",
        attempts: operation.attempts + 1,
        lastError: result.message ?? "The server denied this change.",
      });
    }
  }

  return counts;
}
