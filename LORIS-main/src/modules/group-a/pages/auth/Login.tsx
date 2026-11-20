import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { loginUser, logoutUser } from '../../services/auth.service'
import { useAuth } from '../../contexts/AuthContext'
import { getHomePath, type Membership } from '../../contexts/roles'

/** Why a signed-in account is not an organisation administrator. */
function explainNotAdmin(
  status: string | null | undefined,
  memberships: Membership[]
): string {
  if (status === 'rejected') {
    return 'Your organisation registration was not approved. Please contact LORIS support if you think this is a mistake.'
  }

  if (status === 'approved') {
    const admin = memberships.find((m) => m.role === 'admin')

    return admin
      ? `Your organisation was approved, but your administrator access is "${admin.status}". Please contact LORIS support.`
      : 'Your organisation was approved, but administrator access has not been set up for this account yet. Please contact LORIS support.'
  }

  return 'This account is not an organisation administrator. Use the personal login, or register your organisation first.'
}
function Login() {
  const navigate = useNavigate()
  const isOrgLogin = useLocation().pathname.startsWith('/organisation')
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

      // The organisation login is for organisation administrators only. Anyone else is signed
      // out with the actual reason, rather than being dropped into the end-user area.
      const isAdmin = roles.memberships.some((m) => m.status === 'active' && m.role === 'admin')
      if (isOrgLogin && !isAdmin && roles.profile.platform_role !== 'platform_manager') {
        const reason = explainNotAdmin(roles.organisationRequestStatus, roles.memberships)
        await logoutUser()
        throw new Error(reason)
      }

      setSuccessMessage('Login successful!')
      navigate(getHomePath(roles), { replace: true })
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
          Log in to access your personal library account.
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

      <p className="mt-7 text-center text-base text-muted">
        Don't have an account?{' '}
        <Link
          to={isOrgLogin ? "/organisation-registration" : "/personal/register"}
          className="font-semibold text-brand-text hover:underline"
        >
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
