/** Backend API base URL, supplied through the environment (see .env.example). */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/** Optional address of the public library, used by the "View library" button when set. */
export const LIBRARY_URL: string = import.meta.env.VITE_LIBRARY_URL ?? '';

export const ROUTES = {
  organisationLogin: '/organisation/login',
  organisationRegister: '/organisation/register',
  platformLogin: '/platform/login',
  forgotPassword: '/forgot-password',
  platformDashboard: '/platform',
} as const;
