import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import {
  getHomePath,
  isOrgAdmin as computeIsOrgAdmin,
  isPlatformManager as computeIsPlatformManager,
  type Membership,
  type Profile,
  type RoleState,
} from './roles'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  memberships: Membership[]
  /** True until the session AND the profile/memberships have been resolved. */
  loading: boolean
  isPlatformManager: boolean
  isOrgAdmin: boolean
  homePath: string
  /** Re-reads Profiles + Memberships for the current session and returns them. */
  refreshRoles: () => Promise<RoleState>
  signOut: () => Promise<void>
}

const EMPTY: RoleState = { profile: null, memberships: [] }

const PENDING_ORG_MESSAGE =
  "Your organisation registration is still awaiting review. We'll email you as soon as it is approved, and you can log in then."

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ROLE_CACHE_PREFIX = 'loris-roles:'

function readCachedRoles(userId: string): RoleState | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_PREFIX + userId)
    return raw ? (JSON.parse(raw) as RoleState) : null
  } catch {
    return null
  }
}

function writeCachedRoles(userId: string, state: RoleState) {
  try {
    if (state.profile) localStorage.setItem(ROLE_CACHE_PREFIX + userId, JSON.stringify(state))
  } catch {
    /* storage unavailable: offline role memory is simply skipped */
  }
}

function isNetworkFailure(message: string | undefined): boolean {
  return !navigator.onLine || /failed to fetch|networkerror|network request failed|load failed|fetch/i.test(message ?? '')
}

/** The signed-in user Supabase stored on this device, so the app can still identify them offline. */
function readStoredUser(): User | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && /^sb-.+-auth-token$/.test(key)) {
        const stored = JSON.parse(localStorage.getItem(key) ?? 'null') as { user?: User } | null
        if (stored?.user?.id) return stored.user
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

async function fetchRoleState(user: User): Promise<RoleState> {
  // Offline: use the role remembered from the last successful sign-in instead of failing requests.
  if (!navigator.onLine) return readCachedRoles(user.id) ?? EMPTY
  const state = await fetchRoleStateOnline(user)
  if (state.profile && !state.blocked) writeCachedRoles(user.id, state)
  return state
}

async function fetchRoleStateOnline(user: User): Promise<RoleState> {
  const { data: existing, error } = await supabase
    .from('Profiles')
    .select('id, auth_user_id, full_name, email, platform_role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    if (!isNetworkFailure(error.message)) console.error('Profile retrieval failed:', error.message)
    // Connection dropped mid-request: fall back to the remembered role.
    return isNetworkFailure(error.message) ? readCachedRoles(user.id) ?? EMPTY : EMPTY
  }

  let profile = existing as Profile | null

  // Self-heal for accounts created before the profile trigger existed. RLS only
  // permits inserting a row for yourself with platform_role = 'end_user'.
  if (!profile) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name
        ? (user.user_metadata.full_name as string)
        : 'LORIS User'
    const { data: created, error: insertError } = await supabase
      .from('Profiles')
      .insert({
        auth_user_id: user.id,
        full_name: fullName,
        email: user.email ?? '',
        platform_role: 'end_user',
      })
      .select('id, auth_user_id, full_name, email, platform_role')
      .maybeSingle()
    if (insertError || !created) {
      console.error('Profile creation failed:', insertError?.message)
      return EMPTY
    }
    profile = created as Profile
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('Memberships')
    .select('organisation_id, role, status')
    .eq('user_id', profile.id)

  if (membershipError) {
    console.error('Membership retrieval failed:', membershipError.message)
  }

  const state: RoleState = { profile, memberships: (memberships ?? []) as Membership[] }

  // An organisation applicant is not an end user. Until a Platform Manager approves the request
  // they get no access at all; this is decided here, before any role reaches the app, so they
  // are never routed to end-user pages (not even for a moment).
  if (profile.platform_role !== 'platform_manager' && !computeIsOrgAdmin(state)) {
    const { data: pending } = await supabase
      .from('organisation_requests')
      .select('id')
      .eq('submitted_by', user.id)
      .eq('status', 'pending')
      .limit(1)
    if (pending && pending.length > 0) return { ...EMPTY, blocked: PENDING_ORG_MESSAGE }
  }

  return state
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [roles, setRoles] = useState<RoleState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const userRef = useRef<User | null>(null)

  const loadRoles = useCallback(async (nextUser: User | null): Promise<RoleState> => {
    const id = ++requestId.current
    if (!nextUser) {
      setRoles(EMPTY)
      return EMPTY
    }
    const result = await fetchRoleState(nextUser)
    if (result.blocked) {
      if (id === requestId.current) {
        setRoles(EMPTY)
        await supabase.auth.signOut()
      }
      return result
    }
    // Ignore results from superseded requests (e.g. quick logout/login).
    if (id === requestId.current) setRoles(result)
    return result
  }, [])

  useEffect(() => {
    let mounted = true

    void (async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) console.error('Session retrieval failed:', error.message)

      const current = data.session
      // Offline with an expired token the session cannot be refreshed; still recognise the
      // person from the stored sign-in so downloaded material stays reachable.
      const effectiveUser = current?.user ?? (!navigator.onLine ? readStoredUser() : null)
      userRef.current = effectiveUser
      setSession(current)
      setUser(effectiveUser)
      await loadRoles(effectiveUser)
      if (mounted) setLoading(false)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Offline, a failed token refresh reports "no session"; that is not a sign-out, so keep
      // the remembered identity instead of clearing it (explicit sign-outs still clear it).
      if (!currentSession && !navigator.onLine && event !== 'SIGNED_OUT') return
      const nextUser = currentSession?.user ?? null
      setSession(currentSession)
      setUser(nextUser)

      if (event === 'SIGNED_OUT' || !nextUser) {
        userRef.current = null
        requestId.current++
        setRoles(EMPTY)
        return
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const changed = userRef.current?.id !== nextUser.id
        userRef.current = nextUser
        // Never call supabase APIs synchronously inside this callback (deadlock risk).
        if (changed) setLoading(true)
        setTimeout(() => {
          void loadRoles(nextUser).finally(() => {
            if (mounted) setLoading(false)
          })
        }, 0)
      }
      // TOKEN_REFRESHED: role data is unchanged; do not flash a loading state.
    })

    // Back online: refresh roles from the server in case they changed while away.
    const onOnline = () => {
      if (userRef.current) void loadRoles(userRef.current)
    }
    window.addEventListener('online', onOnline)

    return () => {
      mounted = false
      window.removeEventListener('online', onOnline)
      subscription.unsubscribe()
    }
  }, [loadRoles])

  const refreshRoles = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    return loadRoles(data.user ?? null)
  }, [loadRoles])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    requestId.current++
    setUser(null)
    setSession(null)
    setRoles(EMPTY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile: roles.profile,
        memberships: roles.memberships,
        loading,
        isPlatformManager: computeIsPlatformManager(roles),
        isOrgAdmin: computeIsOrgAdmin(roles),
        homePath: getHomePath(roles),
        refreshRoles,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
