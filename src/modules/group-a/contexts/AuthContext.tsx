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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchRoleState(user: User): Promise<RoleState> {
  const { data: existing, error } = await supabase
    .from('Profiles')
    .select('id, auth_user_id, full_name, email, platform_role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Profile retrieval failed:', error.message)
    return EMPTY
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

  return { profile, memberships: (memberships ?? []) as Membership[] }
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
      userRef.current = current?.user ?? null
      setSession(current)
      setUser(current?.user ?? null)
      await loadRoles(current?.user ?? null)
      if (mounted) setLoading(false)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
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

    return () => {
      mounted = false
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
