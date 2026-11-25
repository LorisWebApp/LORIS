/**
 * LORIS Offline Synchronisation
 *
 * Saves user actions in IndexedDB when the network is unavailable.
 * Replays pending actions when the connection returns.
 *
 * Conflict rules:
 * - 404: The requested item no longer exists. Remove the queued action.
 * - 409: The server has a conflicting/newer version. Server wins.
 * - Network failure: Keep the action for another attempt.
 */

import { ApiError, apiRequest } from "../userApi";

import { idbDelete, idbGetAll, idbPut } from "./indexedDB";

/**
 * Structure of a queued request.
 */
export interface QueuedRequest {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: string;
  attempts: number;
}

/**
 * Result returned after synchronisation.
 */
export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
}

const MAX_ATTEMPTS = 5;

/**
 * Prevents two synchronisation processes from running simultaneously
 * in this application instance.
 */
let syncPromise: Promise<SyncResult> | null = null;

/**
 * Queue listeners allow React components to update when
 * pending offline actions change.
 */
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * Subscribe to changes in the offline queue.
 *
 * Returns a function that removes the subscription.
 */
export function onQueueChange(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sends a queued request to the backend.
 */
async function send(
  request: Pick<QueuedRequest, "method" | "path" | "body">,
): Promise<void> {
  await apiRequest<void>(request.path, {
    method: request.method,

    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });
}

/**
 * Sends a request immediately.
 *
 * If the network is unavailable, saves it in IndexedDB
 * for later synchronisation.
 *
 * Other errors, such as validation or authentication errors,
 * are returned to the calling component.
 */
export async function sendOrQueue(
  method: QueuedRequest["method"],
  path: string,
  body?: unknown,
): Promise<{ queued: boolean }> {
  try {
    await send({ method, path, body });

    return { queued: false };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 0) {
      throw error;
    }

    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      method,
      path,
      body,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    await idbPut("syncQueue", request);

    notify();

    return { queued: true };
  }
}

/**
 * Returns the number of pending requests.
 */
export async function getPendingCount(): Promise<number> {
  try {
    const queue = await idbGetAll<QueuedRequest>("syncQueue");

    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * Processes queued requests in chronological order.
 */
async function processSyncQueue(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    failed: 0,
    conflicts: 0,
  };

  const queue = (await idbGetAll<QueuedRequest>("syncQueue")).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  for (let index = 0; index < queue.length; index++) {
    const request = queue[index];

    try {
      await send(request);

      await idbDelete("syncQueue", request.id);

      result.synced += 1;
    } catch (error) {
      // The server has deleted or rejected the item due to a conflict.
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        await idbDelete("syncQueue", request.id);

        result.conflicts += 1;

        continue;
      }

      // Still offline: leave the remaining requests in the queue.
      if (error instanceof ApiError && error.status === 0) {
        result.failed += queue.length - index;

        break;
      }

      // Retry requests that fail for other reasons.
      if (request.attempts + 1 >= MAX_ATTEMPTS) {
        await idbDelete("syncQueue", request.id);

        result.failed += 1;
      } else {
        await idbPut("syncQueue", {
          ...request,
          attempts: request.attempts + 1,
        });

        result.failed += 1;
      }
    }
  }

  notify();

  return result;
}

/**
 * Synchronises the offline queue.
 *
 * Multiple calls share the same running synchronisation process.
 */
export function flushSyncQueue(): Promise<SyncResult> {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = processSyncQueue().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}
