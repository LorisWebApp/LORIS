/**
 * Favourites (table: user_favourites).
 *
 * API CONTRACT (backend built in a later phase):
 *   PUT    /api/favourites/:materialId -> 204   (add)
 *   DELETE /api/favourites/:materialId -> 204   (remove)
 *
 * Phase 3 (Favourites page) will extend this file with `listFavourites()`.
 */
import { apiRequest, simulateLatency, USE_MOCK_DATA } from "./userApi";

export async function setFavourite(
  materialId: string,
  isFavourite: boolean,
): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateLatency(200);
    return;
  }
  await apiRequest<void>(`/favourites/${encodeURIComponent(materialId)}`, {
    method: isFavourite ? "PUT" : "DELETE",
  });
}
