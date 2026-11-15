import type { UserRole } from '../types/user';

export const ROUTES = {
  login: '/login',
  logout: '/logout',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  organisationRegistration: '/organisation-registration',
  organisationCode: '/organisation-code',
  platform: '/platform',
  organisation: '/organisation',
  organisationUsers: '/organisation/users',
  organisationInvitations: '/organisation/invitations',
  organisationRenewals: '/organisation/renewals',
  organisationTickets: '/organisation/tickets',
  library: '/library',
} as const;

/** Where each role lands after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  platform_manager: ROUTES.platform,
  admin: ROUTES.organisation,
  end_user: ROUTES.library,
};

export const homeRouteForRole = (role: UserRole) => ROLE_HOME[role] ?? ROUTES.library;
