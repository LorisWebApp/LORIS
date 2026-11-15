/**
 * LORIS Offline Encryption
 *
 * Uses the browser's Web Crypto API.
 *
 * Algorithm: AES-GCM
 * Key length: 256 bits
 * IV length: 96 bits (12 bytes)
 *
 * The encryption key is stored in IndexedDB as a
 * non-extractable CryptoKey.
 *
 * This provides protection against casual copying
 * of downloaded files. It is NOT DRM.
 */

import { idbGet, idbPut } from "./indexedDB";

const KEY_ID = "device-key";

let keyPromise: Promise<CryptoKey> | null = null;

/**
 * Retrieves the existing device encryption key
 * or generates a new one.
 */
async function getKey(): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure encryption is not supported in this browser.");
  }

  if (!keyPromise) {
    keyPromise = (async () => {
      const existing = await idbGet<{
        id: string;
        key: CryptoKey;
      }>("keys", KEY_ID);

      if (existing?.key) {
        return existing.key;
      }

      const key = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["encrypt", "decrypt"],
      );

      await idbPut("keys", {
        id: KEY_ID,
        key,
      });

      return key;
    })().catch((error) => {
      keyPromise = null;
      throw error;
    });
  }

  return keyPromise;
}

/**
 * Structure of an encrypted file.
 */
export interface EncryptedBlob {
  iv: ArrayBuffer;
  data: ArrayBuffer;
}

/**
 * Encrypts an ArrayBuffer before offline storage.
 */
export async function encryptBytes(plain: ArrayBuffer): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey();

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    plain,
  );

  return {
    iv: iv.buffer.slice(0),
    data: encryptedData,
  };
}

/**
 * Decrypts a previously encrypted file.
 */
export async function decryptBytes(blob: EncryptedBlob): Promise<ArrayBuffer> {
  if (!blob?.iv || !blob?.data) {
    throw new Error("The saved offline file is incomplete.");
  }

  const key = await getKey();

  try {
    return await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: blob.iv,
      },
      key,
      blob.data,
    );
  } catch {
    throw new Error(
      "This offline file could not be decrypted. It may be corrupted or its encryption key may be unavailable.",
    );
  }
}
