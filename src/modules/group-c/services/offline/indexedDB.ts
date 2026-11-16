/**
 * LORIS Offline Database
 *
 * Stores offline reading data in the browser using IndexedDB.
 *
 * Stores:
 * - meta: Download information and metadata
 * - files: Encrypted material files
 * - keys: Device encryption key records
 * - syncQueue: Pending actions waiting to sync
 *
 * Real material files are NOT stored in PostgreSQL.
 */

const DB_NAME = "library-offline";
const DB_VERSION = 1;

export type StoreName = "meta" | "files" | "keys" | "syncQueue";

const STORES: StoreName[] = ["meta", "files", "keys", "syncQueue"];

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens the IndexedDB database.
 * Reuses an existing connection when possible.
 */
export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("Offline storage is not available in this browser."),
    );
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, {
            keyPath: "id",
          });
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;

      reject(request.error ?? new Error("Could not open offline storage."));
    };
  });

  return dbPromise;
}

/**
 * Runs an IndexedDB operation.
 */
async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  operation: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    let request: IDBRequest<T>;

    try {
      const transaction = db.transaction(store, mode);

      request = operation(transaction.objectStore(store));

      transaction.oncomplete = () => {
        resolve(request.result);
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error("An offline storage operation failed."),
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error("Offline storage operation was aborted."),
        );
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Retrieves one record using its ID.
 */
export const idbGet = <T>(
  store: StoreName,
  key: string,
): Promise<T | undefined> =>
  run<T | undefined>(
    store,
    "readonly",
    (objectStore) => objectStore.get(key) as IDBRequest<T | undefined>,
  );

/**
 * Retrieves all records from a store.
 */
export const idbGetAll = <T>(store: StoreName): Promise<T[]> =>
  run<T[]>(
    store,
    "readonly",
    (objectStore) => objectStore.getAll() as IDBRequest<T[]>,
  );

/**
 * Saves a new record or updates an existing record.
 * Every record must contain an id property.
 */
export const idbPut = <T extends { id: string }>(
  store: StoreName,
  value: T,
): Promise<IDBValidKey> =>
  run<IDBValidKey>(store, "readwrite", (objectStore) => objectStore.put(value));

/**
 * Deletes one record using its ID.
 */
export const idbDelete = (store: StoreName, key: string): Promise<undefined> =>
  run<undefined>(
    store,
    "readwrite",
    (objectStore) => objectStore.delete(key) as IDBRequest<undefined>,
  );

/**
 * Removes all records from a store.
 */
export const idbClear = (store: StoreName): Promise<undefined> =>
  run<undefined>(
    store,
    "readwrite",
    (objectStore) => objectStore.clear() as IDBRequest<undefined>,
  );
