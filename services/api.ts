import { API_BASE_URL } from '../utils/constants';

/** Error thrown for any failed API call. `fieldErrors` carries per-field messages when the backend sends them. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let accessToken: string | null = null;

/** Held in memory only. Persistent session handling is a later task. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

interface ErrorBody {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
}

function readFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};
  const result: Record<string, string> = {};
  Object.entries(errors as Record<string, unknown>).forEach(([field, value]) => {
    const text = Array.isArray(value) ? value[0] : value;
    if (typeof text === 'string') result[field] = text;
  });
  return result;
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('The application is not connected to a server. Set VITE_API_BASE_URL.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const body = (data ?? {}) as ErrorBody;
    const message =
      typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, readFieldErrors(body.errors));
  }

  return data as T;
}
