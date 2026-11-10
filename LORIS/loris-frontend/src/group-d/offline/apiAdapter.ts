import type {
  OfflinePermission,
  SyncOperation,
  SyncResponse,
} from "../types/models";
import type {
  PermissionValidationRequest,
  PermissionValidator,
} from "./permissions";

export interface LorisApiAdapterOptions {
  baseUrl?: string;
  getAccessToken: () => Promise<string | null>;
  fetchImplementation?: typeof fetch;
}

export function createLorisApiAdapter(options: LorisApiAdapterOptions): {
  validateMaterialPermission: PermissionValidator;
  sendSyncBatch: (operations: SyncOperation[]) => Promise<SyncResponse>;
} {
  const fetcher = options.fetchImplementation ?? fetch;
  const baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");

  async function authorisedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await options.getAccessToken();
    if (!token) throw new Error("You must be signed in to perform this action.");

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetcher(`${baseUrl}${path}`, { ...init, headers });
  }

  async function validateMaterialPermission(
    request: PermissionValidationRequest
  ): Promise<OfflinePermission> {
    // Contract to agree with Group A/B. The server must derive the user from
    // the authenticated session rather than trusting a userId from the client.
    const response = await authorisedFetch("/api/materials/offline-permission", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 403) {
        return { allowed: false, reason: "Your account is not authorised to access this material." };
      }
      throw new Error(`Permission validation failed (${response.status}).`);
    }

    return (await response.json()) as OfflinePermission;
  }

  async function sendSyncBatch(operations: SyncOperation[]): Promise<SyncResponse> {
    const response = await authorisedFetch("/api/offline/sync", {
      method: "POST",
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      throw new Error(`Sync request failed (${response.status}).`);
    }

    return (await response.json()) as SyncResponse;
  }

  return { validateMaterialPermission, sendSyncBatch };
}
