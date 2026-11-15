import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { supabase } from '../../services/supabase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setSuccessMessage(
        'Password reset instructions have been sent. Please check your email.'
      )
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Unable to send reset instructions. Please try again.')
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
          Forgot Password?
        </h2>

        <p className="mt-2 text-base text-muted">
          Enter your email address and we'll send you instructions to reset
          your password.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your registered email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {errorMessage && (
          <div className="mb-5">
            <Alert severity="error">
              {errorMessage}
            </Alert>
          </div>
        )}

        {successMessage && (
          <div className="mb-5">
            <Alert severity="success">
              {successMessage}
            </Alert>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          Send Reset Instructions
        </Button>
      </form>

      <p className="mt-7 text-center text-base text-muted">
        Remember your password?{' '}
        <Link
          to="/personal/login"
          className="font-semibold text-brand-text hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ForgotPassword