/**
 * Tiny HTTP layer for the Group C services.
 *
 * ASSUMPTIONS (confirm / replace – each is a one-line change):
 *  1. The frontend is built with Vite, so env vars come from `import.meta.env`.
 *  2. The Express API is served under `VITE_API_BASE_URL` (default "/api").
 *  3. `getAccessToken()` must return the Supabase session access token. Replace its body with the
 *     team's real call, e.g. `(await supabase.auth.getSession()).data.session?.access_token ?? null`.
 *  4. Successful responses are the raw JSON payload (no `{ data: ... }` envelope).
 *
 * MOCK MODE: until the Group C backend exists, services return local mock data. It is ON by default;
 * set `VITE_USE_MOCK_DATA=false` in your .env to call the real API.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
export const USE_MOCK_DATA: boolean =
  (import.meta.env.VITE_USE_MOCK_DATA as string | undefined) !== "false";

// TODO(ASSUMPTION 3): replace with the team's Supabase session lookup.
async function getAccessToken(): Promise<string | null> {
  return null;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* body was not JSON – keep the generic message */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Small delay so loading states are visible while using mock data. */
export function simulateLatency(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
