import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'

import { Button } from '../../components/shared/buttons/Button'
import { Alert } from '../../components/shared/feedback/Alert'

import { supabase } from '../../services/supabase'

function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Your password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user && !data.session) {
        setSuccessMessage(
          'Registration successful! Please check your email to verify your account.'
        )
      } else {
        setSuccessMessage(
          'Registration successful! Your account has been created.'
        )
      }

      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Registration failed. Please try again.')
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
          Create Your Personal Account
        </h2>

        <p className="mt-2 text-base text-muted">
          Join LORIS and access your personal library account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          placeholder="Create a password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {errorMessage && (
          <div className="mb-4">
            <Alert severity="error">
              {errorMessage}
            </Alert>
          </div>
        )}

        {successMessage && (
          <div className="mb-4">
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
          Register
        </Button>
      </form>

      <p className="mt-7 text-center text-base text-muted">
        Already have an account?{' '}
        <Link
          to="/personal/login"
          className="font-semibold text-brand-text hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register