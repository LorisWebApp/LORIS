
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  getCurrentSession,
  logoutUser,
  type AuthUser,
} from '../services/auth.service'

import {
  getHomePath,
  isOrgAdmin as computeIsOrgAdmin,
  isPlatformManager as computeIsPlatformManager,
  type Membership,
  type Profile,
  type RoleState,
} from './roles'

interface AuthContextType {
  user: AuthUser | null
  session: null
  profile: Profile | null
  memberships: Membership[]
  loading: boolean
  isPlatformManager: boolean
  isOrgAdmin: boolean
  homePath: string
  refreshRoles: () => Promise<RoleState>
  signOut: () => Promise<void>
}

const EMPTY: RoleState = { profile: null, memberships: [] }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<RoleState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const refreshRoles = useCallback(async (): Promise<RoleState> => {
    const id = ++requestId.current
    const result = await getCurrentSession()

    if (result.roles.blocked) {
      await logoutUser()

      if (id === requestId.current) {
        setUser(null)
        setRoles(EMPTY)
      }

      return result.roles
    }

    if (id === requestId.current) {
      setUser(result.user)
      setRoles(result.roles)
    }

    return result.roles
  }, [])

  useEffect(() => {
    let mounted = true

    void refreshRoles()
      .catch(() => {
        if (mounted) {
          setUser(null)
          setRoles(EMPTY)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [refreshRoles])

  const signOut = useCallback(async () => {
    await logoutUser()
    requestId.current++
    setUser(null)
    setRoles(EMPTY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
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

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
