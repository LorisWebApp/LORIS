import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
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

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-teal-900">
          Forgot Password?
        </h2>

        <p className="mt-2 text-sm text-gray-600">
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
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>
      </form>

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

export default ForgotPassword