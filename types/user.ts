/** Role names are an assumption until the backend contract is confirmed (see docs/AUTH_FLOW_DEPENDENCIES.md). */
export type UserRole = 'platform_admin' | 'organisation_admin' | 'member';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organisationId?: string | null;
  organisationName?: string | null;
  emailVerified: boolean;
}
