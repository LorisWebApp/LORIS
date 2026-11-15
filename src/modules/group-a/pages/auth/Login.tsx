import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { loginUser, logoutUser } from '../../services/auth.service'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getHomePath } from '../../contexts/roles'

function Login() {
  const navigate = useNavigate()
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

      if (!roles.profile) {
        throw new Error(
          'You are signed in, but your LORIS profile could not be loaded. Please contact support.'
        )
      }

      // An organisation applicant is not an end user: until the Platform Manager approves the
      // request they get no access at all, so sign them straight back out with an explanation.
      if (!roles.memberships.some((m) => m.status === 'active' && m.role === 'admin') && roles.profile.platform_role !== 'platform_manager') {
        const { data: pending } = await supabase
          .from('organisation_requests')
          .select('id')
          .eq('submitted_by', roles.profile.auth_user_id)
          .eq('status', 'pending')
          .limit(1)
        if (pending && pending.length > 0) {
          await logoutUser()
          throw new Error(
            "Your organisation registration is still awaiting review. We'll email you as soon as it is approved, and you can log in then."
          )
        }
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
          to="/personal/register"
          className="font-semibold text-brand-text hover:underline"
        >
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login