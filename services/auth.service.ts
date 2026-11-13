import type { User } from '../types/user';
import { request, tokenStore } from './http';

export interface LoginPayload { organisationName: string; email: string; password: string }
export interface RegisterPayload { invitationCode: string; fullName: string; email: string; password: string }

/** POST /auth/login -> { user, accessToken? }. Cookie-only sessions may omit accessToken. */
export async function login(payload: LoginPayload): Promise<User> {
  const res = await request<{ user: User; accessToken?: string }>('/auth/login', { method: 'POST', body: payload, silent401: true });
  if (res.accessToken) tokenStore.set(res.accessToken);
  return res.user;
}

/** POST /auth/logout. The local session is always cleared, even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST', silent401: true });
  } finally {
    tokenStore.clear();
  }
}

/** GET /auth/me -> { user } */
export async function getCurrentUser(signal?: AbortSignal): Promise<User> {
  const res = await request<{ user: User }>('/auth/me', { signal, silent401: true });
  return res.user;
}

/** POST /auth/register (account creation with an organisation invitation code). */
export function registerWithInvitation(payload: RegisterPayload): Promise<void> {
  return request('/auth/register', { method: 'POST', body: payload, silent401: true });
}

/** POST /auth/forgot-password */
export function requestPasswordReset(email: string): Promise<void> {
  return request('/auth/forgot-password', { method: 'POST', body: { email }, silent401: true });
}

/** POST /auth/reset-password */
export function resetPassword(token: string, password: string): Promise<void> {
  return request('/auth/reset-password', { method: 'POST', body: { token, password }, silent401: true });
}

/** POST /auth/verify-email (token from the emailed link) */
export function verifyEmail(token: string): Promise<void> {
  return request('/auth/verify-email', { method: 'POST', body: { token }, silent401: true });
}

/** POST /auth/resend-verification */
export function sendVerificationEmail(email: string): Promise<void> {
  return request('/auth/resend-verification', { method: 'POST', body: { email }, silent401: true });
}
