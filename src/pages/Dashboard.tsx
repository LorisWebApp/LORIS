import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-4 text-3xl font-bold text-teal-900">
          Welcome to LORIS!
        </h1>

        <p className="mb-2">
          Email: {user?.email}
        </p>

        <p className="mb-6">
          Name: {profile?.full_name ?? 'Loading profile...'}
        </p>

        <p className="mb-6">
          Role: {profile?.platform_role ?? 'Loading role...'}
        </p>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-teal-800 px-6 py-3 text-white hover:bg-teal-900"
        >
          Logout
        </button>
      </div>
    </main>
  )
}

export default Dashboard