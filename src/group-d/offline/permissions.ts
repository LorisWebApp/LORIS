import type { OfflinePermission } from "../types/models";

export interface PermissionValidationRequest {
  materialId: string;
  organisationId?: string;
}

export type PermissionValidator = (
  request: PermissionValidationRequest
) => Promise<OfflinePermission>;

export function isOfflinePermissionValid(
  permission: OfflinePermission,
  now: Date = new Date()
): boolean {
  if (!permission.allowed || !permission.offlineAllowedUntil) return false;

  const expiry = new Date(permission.offlineAllowedUntil);
  if (Number.isNaN(expiry.getTime())) return false;

  return now.getTime() <= expiry.getTime();
}

export async function validatePermissionBeforeSave(
  request: PermissionValidationRequest,
  validator: PermissionValidator
): Promise<OfflinePermission> {
  const result = await validator(request);

  if (!result.allowed) {
    throw new Error(result.reason || "You do not have permission to save this material offline.");
  }

  if (!result.offlineAllowedUntil || !isOfflinePermissionValid(result)) {
    throw new Error("The server did not provide a valid offline-access expiry.");
  }

  return result;
}

export function assertOfflineAccessAllowed(
  permission: OfflinePermission,
  now: Date = new Date()
): void {
  if (!isOfflinePermissionValid(permission, now)) {
    throw new Error("Offline access has expired. Connect to the internet and validate access again.");
  }
}
