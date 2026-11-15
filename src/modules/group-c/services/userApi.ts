/**
 * HTTP layer for Group C services.
 *
 * API configuration:
 * - Vite environment variables are read through import.meta.env.
 * - The Express API uses VITE_API_BASE_URL.
 * - The default API base URL is /api.
 * - Authentication will be connected to the Supabase session later.
 * - Successful responses return JSON payloads.
 *
 * Mock mode is disabled in the consolidated application.
 */

import { supabase } from "../../../services/supabase";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as
  | string
  | undefined;

export const API_BASE_URL = (configuredBaseUrl?.trim() || "/api").replace(
  /\/+$/,
  "",
);

export const USE_MOCK_DATA = false;

/**
 * Retrieves the current user's Supabase access token.
 *
 * Supabase authentication is not connected yet.
 * Replace this function when authentication integration is ready.
 */
async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

/**
 * Standard API error.
 * Status 0 represents a network or connection failure.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Sends an HTTP request to the Group C backend.
 *
 * Automatically:
 * - Adds JSON headers.
 * - Adds the authentication token when available.
 * - Handles network failures.
 * - Converts unsuccessful responses into ApiError.
 * - Handles HTTP 204 responses.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${API_BASE_URL}${normalizedPath}`;

  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  if (
    init.body !== undefined &&
    init.body !== null &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your internet connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const responseBody = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (responseBody.message) {
        message = responseBody.message;
      } else if (responseBody.error) {
        message = responseBody.error;
      }
    } catch {
      // Keep the generic error if the response is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
    );
  }
}

/**
 * Adds a small delay to mock requests so loading states
 * can be seen during development.
 */
export function simulateLatency(ms = 450): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}
