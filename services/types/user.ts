/** Platform roles used by the supplied pages. */
export type UserRole = 'platform_manager' | 'organisation_admin';

/** Which sign-in page a person is using. */
export type LoginPortal = 'platform' | 'organisation';

export interface User {
  id: string;
  email: string;
  fullName: string;
  /** Other roles may exist on the backend; only these two sign in through the supplied pages. */
  role: UserRole | (string & {});
  organisationId?: string | null;
}

export interface LoginRequest {
  portal: LoginPortal;
  email: string;
  password: string;
  /** Required by the Organisation Admin portal only. */
  organisationName?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface MessageResponse {
  message?: string;
}

export type PlatformUserFilter = 'all' | 'organisation_admin' | 'member';

/** A person listed in the Platform Manager users directory. */
export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: 'organisation_admin' | 'member';
  organisationName?: string | null;
  emailVerified: boolean;
}

export interface PlatformUserPage {
  items: PlatformUser[];
  total: number;
  counts: Record<PlatformUserFilter, number>;
}
