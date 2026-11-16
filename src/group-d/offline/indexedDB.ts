import type { OfflineMaterialRecord, SyncOperation } from "../types/models";

const DB_NAME = "loris-offline";
const DB_VERSION = 1;
const MATERIALS_STORE = "materials";
const SYNC_STORE = "sync-queue";

let databasePromise: Promise<IDBDatabase> | undefined;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export function openLorisDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(MATERIALS_STORE)) {
          const materials = db.createObjectStore(MATERIALS_STORE, { keyPath: "metadata.id" });
          materials.createIndex("savedAt", "metadata.savedAt");
          materials.createIndex("ownerUserId", "metadata.ownerUserId");
        }

        if (!db.objectStoreNames.contains(SYNC_STORE)) {
          const queue = db.createObjectStore(SYNC_STORE, { keyPath: "operationId" });
          queue.createIndex("createdAt", "createdAt");
          queue.createIndex("status", "status");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error("Could not open LORIS IndexedDB."));
      };
      request.onblocked = () => {
        console.warn("LORIS database upgrade is blocked by another open tab.");
      };
    });
  }

  return databasePromise;
}

export async function putMaterial(record: OfflineMaterialRecord): Promise<void> {
  const db = await openLorisDatabase();
  const tx = db.transaction(MATERIALS_STORE, "readwrite");
  tx.objectStore(MATERIALS_STORE).put(record);
  await transactionDone(tx);
}

export async function getMaterial(id: string): Promise<OfflineMaterialRecord | undefined> {
  const db = await openLorisDatabase();
  const tx = db.transaction(MATERIALS_STORE, "readonly");
  const result = await requestToPromise<OfflineMaterialRecord | undefined>(
    tx.objectStore(MATERIALS_STORE).get(id)
  );
  await transactionDone(tx);
  return result;
}

export async function getAllMaterials(): Promise<OfflineMaterialRecord[]> {
  const db = await openLorisDatabase();
  const tx = db.transaction(MATERIALS_STORE, "readonly");
  const result = await requestToPromise<OfflineMaterialRecord[]>(
    tx.objectStore(MATERIALS_STORE).getAll()
  );
  await transactionDone(tx);
  return result;
}

export async function deleteMaterial(id: string): Promise<void> {
  const db = await openLorisDatabase();
  const tx = db.transaction(MATERIALS_STORE, "readwrite");
  tx.objectStore(MATERIALS_STORE).delete(id);
  await transactionDone(tx);
}

export async function putSyncOperation(operation: SyncOperation): Promise<void> {
  const db = await openLorisDatabase();
  const tx = db.transaction(SYNC_STORE, "readwrite");
  tx.objectStore(SYNC_STORE).put(operation);
  await transactionDone(tx);
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  const db = await openLorisDatabase();
  const tx = db.transaction(SYNC_STORE, "readonly");
  const store = tx.objectStore(SYNC_STORE);
  const result = await requestToPromise<SyncOperation[]>(store.getAll());
  await transactionDone(tx);
  return result.filter((operation) => operation.status === "pending");
}

export async function getAllSyncOperations(): Promise<SyncOperation[]> {
  const db = await openLorisDatabase();
  const tx = db.transaction(SYNC_STORE, "readonly");
  const result = await requestToPromise<SyncOperation[]>(tx.objectStore(SYNC_STORE).getAll());
  await transactionDone(tx);
  return result;
}

export async function updateSyncOperation(operation: SyncOperation): Promise<void> {
  const db = await openLorisDatabase();
  const tx = db.transaction(SYNC_STORE, "readwrite");
  tx.objectStore(SYNC_STORE).put(operation);
  await transactionDone(tx);
}

export async function deleteSyncOperation(operationId: string): Promise<void> {
  const db = await openLorisDatabase();
  const tx = db.transaction(SYNC_STORE, "readwrite");
  tx.objectStore(SYNC_STORE).delete(operationId);
  await transactionDone(tx);
}

export async function clearUserData(ownerUserId: string): Promise<void> {
  const [materials, operations] = await Promise.all([
    getAllMaterials(),
    getPendingSyncOperations(),
  ]);

  const db = await openLorisDatabase();
  const tx = db.transaction([MATERIALS_STORE, SYNC_STORE], "readwrite");
  const materialStore = tx.objectStore(MATERIALS_STORE);
  const syncStore = tx.objectStore(SYNC_STORE);

  for (const material of materials) {
    if (material.metadata.ownerUserId === ownerUserId) {
      materialStore.delete(material.metadata.id);
    }
  }

  // Sync operations are user-scoped by the owning app. Do not clear the whole
  // queue here because the operation payload may contain records for other users.
  for (const operation of operations) {
    if (operation.payload.ownerUserId === ownerUserId) {
      syncStore.delete(operation.operationId);
    }
  }

  await transactionDone(tx);
}
