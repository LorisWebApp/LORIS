import type { UserRole } from './user';

export interface Membership {
  userId: string;
  organisationId: string;
  role: UserRole;
}
