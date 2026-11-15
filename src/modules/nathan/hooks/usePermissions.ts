import { useAuth } from './useAuth';
import type { UserRole } from '../types/user';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const hasRole = (...allowed: UserRole[]) => role !== null && allowed.includes(role);

  return {
    role,
    hasRole,
    isPlatformAdmin: role === 'platform_manager',
    isOrganisationAdmin: role === 'admin',
    isMember: role === 'end_user',
  };
}
