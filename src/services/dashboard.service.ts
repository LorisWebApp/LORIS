/**
 * Dashboard data access.
 *
 * API CONTRACT (to be implemented by the Group C backend in a later phase):
 *   GET    /api/user/dashboard                -> DashboardData   (scoped to the authenticated user)
 *   DELETE /api/offline/downloads/:downloadId -> 204             (removes the server-side download record)
 *
 * While USE_MOCK_DATA is true these functions use the in-memory mock instead of the network.
 */
import { createMockDashboard } from "../mocks/dashboard.mock";
import type { DashboardData } from "../types/userLibrary.types";
import { apiRequest, simulateLatency, USE_MOCK_DATA } from "./userApi";

let mockState: DashboardData | null = null;
const getMockState = (): DashboardData => (mockState ??= createMockDashboard());
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function fetchDashboard(): Promise<DashboardData> {
  if (USE_MOCK_DATA) {
    await simulateLatency();
    return clone(getMockState());
  }
  return apiRequest<DashboardData>("/user/dashboard");
}

/**
 * Removes an offline download.
 * TODO(Phase 4 – Offline Library): also delete the encrypted file from IndexedDB through
 * services/offline/offlineStorage.ts so no orphaned local copy remains.
 */
export async function removeOfflineDownload(downloadId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateLatency(300);
    const state = getMockState();
    state.offline.downloads = state.offline.downloads.filter(
      (d) => d.id !== downloadId,
    );
    return;
  }
  await apiRequest<void>(
    `/offline/downloads/${encodeURIComponent(downloadId)}`,
    { method: "DELETE" },
  );
}
