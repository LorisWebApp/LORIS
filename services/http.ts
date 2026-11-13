/**
 * Minimal fetch wrapper for the auth/organisation services.
 * If the project already has a shared HTTP client (e.g. an axios instance), point the
 * services at it instead and delete this file.
 */
import { ApiError } from './apiError';

export { ApiError };

/** "true" serves every call from the in-browser mock server (src/services/mock). */
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'loris.accessToken';

export const UNAUTHORIZED_EVENT = 'loris:unauthorized';

export const tokenStore = {
  get(): string | null {
    try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token: string) {
    try { window.localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear() {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Do not broadcast a session-expired event on 401 (login, password flows, /auth/me). */
  silent401?: boolean;
}

function normaliseFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const msg = Array.isArray(value) ? value[0] : value;
    if (typeof msg === 'string') out[key] = msg;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function request<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCKS) {
    const { mockRequest } = await import('./mock/mockServer');
    return mockRequest<T>(path, options, tokenStore.get());
  }

  const { method = 'GET', body, signal, silent401 } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  // For FormData the browser sets the multipart Content-Type (with boundary) itself.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  let payload: unknown;
  if (response.status !== 204) {
    try { payload = await response.json(); } catch { payload = undefined; }
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { message?: string; error?: string; code?: string; errors?: unknown };
    if (response.status === 401 && !silent401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(
      data.message ?? data.error ?? 'Something went wrong. Please try again.',
      response.status,
      data.code,
      normaliseFieldErrors(data.errors),
    );
  }
  return payload as T;
}
