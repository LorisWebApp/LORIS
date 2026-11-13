import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
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

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-teal-900">
          Create Your Account
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Join LORIS and access your library account.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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
          {loading ? 'Creating Account...' : 'Register'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-teal-800 hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register