
import type { RoleState } from '../contexts/roles'

const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
).replace(/\/$/, '')

export interface AuthUser {
  id: string
  email: string
  user_metadata: Record<string, unknown>
  email_confirmed_at: string | null
}

interface AuthResponse {
  user: AuthUser
}

interface SessionResponse {
  user: AuthUser
  roles: RoleState
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return typeof data.error === 'string'
      ? data.error
      : 'Authentication request failed.'
  } catch {
    return 'Authentication request failed.'
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = (await response.json()) as AuthResponse
  return data.user
}

export async function registerUser(
  fullName: string,
  email: string,
  password: string,
): Promise<{ requiresEmailConfirmation: boolean }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password }),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = (await response.json()) as {
    requiresEmailConfirmation: boolean
  }

  return {
    requiresEmailConfirmation: data.requiresEmailConfirmation,
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }
}

export async function getCurrentSession(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as SessionResponse
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }
}
