import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { loginUser, logoutUser } from '../../services/auth.service'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getHomePath, type Membership } from '../../contexts/roles'

/** Why a signed-in account is not an organisation administrator (shown on the organisation login). */
async function explainNotAdmin(authUserId: string, memberships: Membership[]): Promise<string> {
  const { data } = await supabase
    .from('organisation_requests')
    .select('status')
    .eq('submitted_by', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
  const status = data?.[0]?.status as string | undefined

  if (status === 'rejected') return 'Your organisation registration was not approved. Please contact LORIS support if you think this is a mistake.'
  if (status === 'approved') {
    const admin = memberships.find((m) => m.role === 'admin')
    return admin
      ? `Your organisation was approved, but your administrator access is "${admin.status}". Please contact LORIS support.`
      : 'Your organisation was approved, but administrator access has not been set up for this account yet. Please contact LORIS support.'
  }
  return 'This account is not an organisation administrator. Use the personal login, or register your organisation first.'
}

type LoginMode = 'personal' | 'organisation' | 'platform'

const SUBTITLE: Record<LoginMode, string> = {
  personal: 'Log in to access your personal library account.',
  organisation: 'Log in to manage your organisation’s library.',
  platform: 'Log in to the LORIS platform management area.',
}

function Login() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const mode: LoginMode = pathname.startsWith('/platform')
    ? 'platform'
    : pathname.startsWith('/organisation')
      ? 'organisation'
      : 'personal'
  const isOrgLogin = mode === 'organisation'
  const { refreshRoles } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)

    try {
      await loginUser(email.trim(), password)

      // Resolve Profiles.platform_role + active Memberships BEFORE navigating,
      // so each role lands on its own area (/platform, /manage, /dashboard).
      const roles = await refreshRoles()

      // Organisation applicant still awaiting approval (AuthContext has already signed them out).
      if (roles.blocked) throw new Error(roles.blocked)

      if (!roles.profile) {
        throw new Error(
          'You are signed in, but your LORIS profile could not be loaded. Please contact support.'
        )
      }

      // Each login accepts only its own kind of account. Anyone else is signed out and told
      // which login to use, rather than being dropped into a different area.
      const isAdmin = roles.memberships.some((m) => m.status === 'active' && m.role === 'admin')
      const isManager = roles.profile.platform_role === 'platform_manager'

      if (mode === 'personal' && (isAdmin || isManager)) {
        await logoutUser()
        throw new Error(
          isManager
            ? 'This is a platform manager account. Use the Platform Manager login instead.'
            : 'This is an organisation administrator account. Please use the Organisational Account login.'
        )
      }

      if (mode === 'organisation' && !isAdmin) {
        const reason = isManager
          ? 'This is a platform manager account. Use the Platform Manager login instead.'
          : await explainNotAdmin(roles.profile.auth_user_id, roles.memberships)
        await logoutUser()
        throw new Error(reason)
      }

      if (mode === 'platform' && !isManager) {
        await logoutUser()
        throw new Error('This account is not a platform manager. Use the Personal or Organisational Account login.')
      }

      setSuccessMessage('Login successful!')
      // Land in the area that matches the login that was used.
      navigate(
        mode === 'platform' ? '/platform' : mode === 'organisation' ? '/manage' : getHomePath(roles),
        { replace: true },
      )
      return

    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(
          /email not confirmed/i.test(error.message)
            ? 'Your email address has not been verified yet. Please open the confirmation email we sent you, then log in.'
            : error.message
        )
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }

      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Logo />

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold text-deep">
          Welcome Back!
        </h2>

        <p className="mt-2 text-base text-muted">
          {SUBTITLE[mode]}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-text hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {errorMessage && (
          <Alert severity="error">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success">
            {successMessage}
          </Alert>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading || !!successMessage}
        >
          {successMessage ? 'Login Successful' : 'Login'}
        </Button>
      </form>

      {mode !== 'platform' && (
        <p className="mt-7 text-center text-base text-muted">
          Don't have an account?{' '}
          <Link
            to={isOrgLogin ? "/organisation-registration" : "/personal/register"}
            className="font-semibold text-brand-text hover:underline"
          >
            Register
          </Link>
        </p>
      )}

      <Link
        to={mode === 'platform' ? '/login' : '/platform/login'}
        className="fixed bottom-4 right-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-text shadow hover:bg-white hover:underline"
      >
        {mode === 'platform' ? 'Back to login options' : 'Platform manager login'}
      </Link>
    </AuthLayout>
  )
}

export default Login
