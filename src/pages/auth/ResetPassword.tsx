import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { supabase } from '../../services/supabase'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error || !data.session) {
        setErrorMessage(
          'Your password reset session is invalid or has expired. Please request another reset link.'
        )
      } else {
        setRecoveryReady(true)
      }

      setCheckingSession(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoveryReady(true)
        setErrorMessage('')
        setCheckingSession(false)
      }
    })

    checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!recoveryReady) {
      setErrorMessage('Please request a new password reset link.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      setSuccessMessage('Your password has been updated successfully!')
      setRecoveryReady(false)
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update your password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Logo />

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-teal-900">
          Reset Your Password
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      {checkingSession ? (
        <p className="text-center text-gray-600">
          Verifying your password reset link...
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {recoveryReady && (
            <>
              <Input
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          {errorMessage && (
            <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          {recoveryReady && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-semibold text-teal-800 hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ResetPassword