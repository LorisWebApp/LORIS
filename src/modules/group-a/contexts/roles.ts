export type PlatformRole = 'platform_manager' | 'end_user'
export type MembershipRole = 'admin' | 'end_user'
export type MembershipStatus = 'pending' | 'active' | 'suspended'

export interface Profile {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  platform_role: PlatformRole
}

export interface Membership {
  organisation_id: number
  role: MembershipRole
  status: MembershipStatus
}

export interface RoleState {
  profile: Profile | null
  memberships: Membership[]
  /** Set when the account must not be signed in (e.g. organisation request still pending). */
  blocked?: string
}

export function isPlatformManager(state: RoleState): boolean {
  return state.profile?.platform_role === 'platform_manager'
}

/** Only ACTIVE admin memberships grant organisation-admin access. */
export function isOrgAdmin(state: RoleState): boolean {
  return state.memberships.some((m) => m.status === 'active' && m.role === 'admin')
}

/** Destination after login: Platform Manager > Organisation Admin > End User. */
export function getHomePath(state: RoleState): string {
  if (isPlatformManager(state)) return '/platform'
  if (isOrgAdmin(state)) return '/manage'
  return '/dashboard'
}
