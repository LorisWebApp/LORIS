
import { useCallback } from 'react'
import { useAuth as useGroupAAuth } from '../../group-a/contexts/AuthContext'
import { loginUser } from '../../group-a/services/auth.service'
import type { User, UserRole } from '../types/user'

/** Compatibility adapter: Nathan's screens use the shared backend cookie session. */
export function useAuth() {
  const auth = useGroupAAuth()

  const role: UserRole = auth.isPlatformManager
    ? 'platform_manager'
    : auth.isOrgAdmin
      ? 'admin'
      : 'end_user'

  const user: User | null = auth.user
    ? {
        id: auth.user.id,
        email: auth.user.email ?? '',
        fullName:
          auth.profile?.full_name ??
          String(auth.user.user_metadata?.full_name ?? auth.user.email ?? 'LORIS user'),
        role,
        emailVerified: Boolean(auth.user.email_confirmed_at),
      }
    : null

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const loggedInUser = await loginUser(payload.email, payload.password)
      const roles = await auth.refreshRoles()

      if (roles.blocked) {
        throw new Error(roles.blocked)
      }

      if (!roles.profile) {
        throw new Error('Your LORIS profile could not be loaded. Please contact support.')
      }

      const userRole: UserRole =
        roles.profile.platform_role === 'platform_manager'
          ? 'platform_manager'
          : roles.memberships.some(
                (membership) =>
                  membership.role === 'admin' && membership.status === 'active'
              )
            ? 'admin'
            : 'end_user'

      return {
        id: loggedInUser.id,
        email: loggedInUser.email ?? '',
        fullName:
          roles.profile.full_name ??
          String(loggedInUser.user_metadata?.full_name ?? loggedInUser.email ?? ''),
        role: userRole,
        emailVerified: Boolean(loggedInUser.email_confirmed_at),
      }
    },
    [auth.refreshRoles]
  )

  const logout = useCallback(async () => auth.signOut(), [auth.signOut])

  const refresh = useCallback(async () => {
    await auth.refreshRoles()
  }, [auth.refreshRoles])

  return {
    user,
    status: auth.loading
      ? ('loading' as const)
      : user
        ? ('authenticated' as const)
        : ('unauthenticated' as const),
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh,
  }
}
