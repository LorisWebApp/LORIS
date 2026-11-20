import type {
  OfflineMaterialMetadata,
  OfflineMaterialRecord,
  OfflinePermission,
} from "../types/models";
import { deleteMaterial, getAllMaterials, getMaterial, putMaterial } from "./indexedDB";
import { assertOfflineAccessAllowed, validatePermissionBeforeSave, type PermissionValidator } from "./permissions";

export interface SaveOfflineMaterialInput {
  material: Omit<OfflineMaterialMetadata, "savedAt" | "offlineAllowedUntil"> & {
    offlineAllowedUntil?: string;
  };
  fileBlob: Blob;
  permission?: OfflinePermission;
  permissionValidator?: PermissionValidator;
  now?: Date;
}

export async function saveMaterialForOffline(input: SaveOfflineMaterialInput): Promise<void> {
  if (!input.fileBlob || input.fileBlob.size === 0) {
    throw new Error("The downloaded material file is empty.");
  }

  let permission = input.permission;

  if (!permission && input.permissionValidator) {
    permission = await validatePermissionBeforeSave(
      { materialId: input.material.id, organisationId: input.material.organisationId },
      input.permissionValidator
    );
  }

  if (!permission && input.material.offlineAllowedUntil) {
    permission = {
      allowed: true,
      offlineAllowedUntil: input.material.offlineAllowedUntil,
      validatedAt: new Date().toISOString(),
    };
  }

  if (!permission) {
    throw new Error("A successful server permission validation is required before saving offline.");
  }

  assertOfflineAccessAllowed(permission, input.now);

  const metadata: OfflineMaterialMetadata = {
    ...input.material,
    savedAt: new Date().toISOString(),
    offlineAllowedUntil: permission.offlineAllowedUntil!,
  };

  const record: OfflineMaterialRecord = { metadata, fileBlob: input.fileBlob };
  try {
    await putMaterial(record);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("There is not enough device storage to save this material.");
    }
    throw error;
  }
}

export async function getOfflineMaterial(
  materialId: string,
  now: Date = new Date()
): Promise<OfflineMaterialRecord | undefined> {
  const record = await getMaterial(materialId);
  if (!record) return undefined;

  assertOfflineAccessAllowed(
    {
      allowed: true,
      offlineAllowedUntil: record.metadata.offlineAllowedUntil,
      validatedAt: record.metadata.savedAt,
    },
    now
  );

  return record;
}

export async function listOfflineMaterials(): Promise<OfflineMaterialMetadata[]> {
  const records = await getAllMaterials();
  return records.map((record) => record.metadata);
}

export async function removeOfflineMaterial(materialId: string): Promise<void> {
  await deleteMaterial(materialId);
}

export async function getOfflineStorageUsage(): Promise<{
  usedBytes: number;
  materialCount: number;
  quotaBytes?: number;
  usageBytes?: number;
}> {
  const records = await getAllMaterials();
  const usedBytes = records.reduce((total, record) => total + record.fileBlob.size, 0);

  let quotaBytes: number | undefined;
  let usageBytes: number | undefined;

  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    quotaBytes = estimate.quota;
    usageBytes = estimate.usage;
  }

  return { usedBytes, materialCount: records.length, quotaBytes, usageBytes };
}
