import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { loginUser } from '../../services/auth.service'
import { supabase } from '../../services/supabase'

function Login() {
  const navigate = useNavigate()

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
      // 1. Authenticate user
      const loginData = await loginUser(email.trim(), password)
      const userId = loginData.user?.id

      if (!userId) {
        throw new Error('Unable to retrieve authenticated user.')
      }

      console.log('LOGIN USER ID:', userId)

      // 2. Retrieve the user's profile and role
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('platform_role')
        .eq('auth_user_id', userId)
        .single()

      // Diagnostic information
      console.log('PROFILE DATA:', profile)
      console.log('PROFILE ERROR:', profileError)

      if (profileError || !profile) {
        throw new Error(
          'Unable to retrieve your account information. Please contact support.'
        )
      }

      // 3. Redirect according to the user's role
      console.log('USER ROLE:', profile.platform_role)

      if (profile.platform_role === 'platform_manager') {
        console.log('REDIRECTING TO PLATFORM DASHBOARD')
        navigate('/platform/dashboard', { replace: true })
      } else if (profile.platform_role === 'end_user') {
        console.log('REDIRECTING TO END USER DASHBOARD')
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error(
          `Unrecognized account role: ${profile.platform_role}`
        )
      }

    } catch (error) {
      console.error('LOGIN/REDIRECT ERROR:', error)

      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }

    } finally {
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
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
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