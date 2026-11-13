import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import Logo from '../../components/common/Logo'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { loginUser } from '../../services/auth.service'


function Login() {
  const navigate = useNavigate() 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrorMessage('')
    setLoading(true)

    try {
      await loginUser(email, password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
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

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-teal-900">
          Welcome Back!
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Log in to access your library account.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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

        <div className="mb-6 flex justify-end">
          <Link
            to="/forgot-password"
             className="text-sm font-medium text-teal-800 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
      <Link
         to="/register"
         className="font-semibold text-teal-800 hover:underline"
      >
         Register
      </Link>
      </p>
    </AuthLayout>
  )
}

export default Login