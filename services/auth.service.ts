import type { LoginRequest, LoginResponse, MessageResponse, PasswordResetRequest, User } from '../types/user';
import { apiRequest } from './api';

export const authService = {
  login: (payload: LoginRequest) => apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: payload }),

  /** Returns the currently signed-in user (used to restore a session on page load). */
  me: () => apiRequest<{ user: User }>('/auth/me'),

  /** Asks the backend to email a password reset link. */
  requestPasswordReset: (payload: PasswordResetRequest) => apiRequest<MessageResponse>('/auth/forgot-password', { method: 'POST', body: payload }),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
};
