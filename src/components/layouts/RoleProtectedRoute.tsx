import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { useEffect, useState } from 'react'

type AllowedRole = 'platform_manager' | 'admin' | 'end_user'

interface RoleProtectedRouteProps {
  allowedRoles: AllowedRole[]
}

function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkRole = async () => {
      if (loading) return

      if (!user || !profile) {
        setHasAccess(false)
        setCheckingRole(false)
        return
      }

      // Check platform roles directly from Profiles.
      if (
        allowedRoles.includes('end_user') &&
        profile.platform_role === 'end_user'
      ) {
        setHasAccess(true)
        setCheckingRole(false)
        return
      }

      if (
        allowedRoles.includes('platform_manager') &&
        profile.platform_role === 'platform_manager'
      ) {
        setHasAccess(true)
        setCheckingRole(false)
        return
      }

      // Check organisation admin access through Memberships.
      if (allowedRoles.includes('admin')) {
        const { data, error } = await supabase
          .from('Memberships')
          .select('id')
          .eq('user_id', profile.id)
          .eq('role', 'admin')
          .eq('status', 'active')

        if (!cancelled) {
          setHasAccess(!error && (data?.length ?? 0) > 0)
          setCheckingRole(false)
        }
        return
      }

      if (!cancelled) {
        setHasAccess(false)
        setCheckingRole(false)
      }
    }

    checkRole()

    return () => {
      cancelled = true
    }
  }, [user, profile, loading, allowedRoles.join('|')])

  if (loading || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking permissions...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-red-700">Access Denied</h1>
        <p className="mt-3 text-gray-600">
          You do not have permission to access this page.
        </p>
      </div>
    )
  }

  return <Outlet />
}

export default RoleProtectedRoute